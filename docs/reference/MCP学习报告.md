# MCP (Model Context Protocol) 学习报告

> 报告生成时间：2026-02-19  
> SDK版本：@modelcontextprotocol/sdk v1.26.0

---

## 目录

1. [MCP 架构概述](#1-mcp-架构概述)
2. [核心概念详解](#2-核心概念详解)
3. [创建基本 MCP 服务器](#3-创建基本-mcp-服务器)
4. [Tool 定义方式](#4-tool-定义方式)
5. [错误处理最佳实践](#5-错误处理最佳实践)
6. [配置文件格式](#6-配置文件格式)

---

## 1. MCP 架构概述

### 1.1 什么是 MCP？

**Model Context Protocol (MCP)** 是一种开放协议，旨在标准化大型语言模型（LLM）与外部数据源、工具之间的交互方式。它将提供上下文的能力与实际 LLM 交互分离，使开发者能够以统一的方式为 AI 应用提供上下文信息。

### 1.2 架构参与者

MCP 采用**客户端-服务器架构**，包含以下关键参与者：

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Host                                  │
│  (AI 应用，如 Claude Desktop, VS Code, 或其他 LLM 应用)          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ MCP Client 1 │    │ MCP Client 2 │    │ MCP Client N │       │
│  │  (连接Sentry) │    │(连接文件系统) │    │   (连接...)   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
└─────────┼───────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │ MCP Server 1 │    │ MCP Server 2 │    │ MCP Server N │
   │  (远程Sentry) │    │(本地文件系统) │    │   (其他...)   │
   └──────────────┘    └──────────────┘    └──────────────┘
```

| 参与者 | 描述 | 示例 |
|--------|------|------|
| **MCP Host** | 协调和管理一个或多个 MCP 客户端的 AI 应用程序 | Claude Desktop, VS Code, Kimi CLI |
| **MCP Client** | 与 MCP 服务器保持连接并获取上下文的组件 | Host 内的客户端实例 |
| **MCP Server** | 向 MCP 客户端提供上下文的程序 | 文件系统服务器、数据库服务器、API 服务器 |

### 1.3 协议分层

MCP 由两层组成：

#### 数据层 (Data Layer)
实现基于 JSON-RPC 2.0 的交换协议，包括：

- **生命周期管理**：连接初始化、能力协商、连接终止
- **服务器功能**：Tools、Resources、Prompts
- **客户端功能**：Sampling、Elicitation
- **工具功能**：Notifications（实时更新）、进度跟踪

#### 传输层 (Transport Layer)
管理客户端和服务器之间的通信通道：

| 传输方式 | 适用场景 | 特点 |
|----------|----------|------|
| **Stdio** | 本地进程间通信 | 无网络开销，适合本地集成 |
| **Streamable HTTP** | 远程服务器通信 | 支持标准 HTTP 认证，支持 SSE |
| **HTTP + SSE** | 兼容性场景 | 传统方式，向后兼容 |

### 1.4 与 LSP 的关系

MCP 的设计灵感来源于 **Language Server Protocol (LSP)**：
- LSP 标准化了如何在开发工具生态系统中添加编程语言支持
- MCP 以类似的方式标准化了如何将额外的上下文和工具集成到 AI 应用生态系统中

---

## 2. 核心概念详解

### 2.1 Resources (资源)

**Resources** 是服务器提供给客户端的**只读数据**，用于为 AI 应用提供上下文信息。

#### 特点：
- 通过唯一 URI 标识（如 `file:///path/to/file`, `data://users`）
- 可以是文件内容、数据库记录、API 响应等
- 客户端使用 `resources/list` 和 `resources/read` 方法访问

#### 使用场景：
```typescript
// 示例：提供配置文件内容
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      { uri: "config://app", name: "应用配置", mimeType: "application/json" },
      { uri: "docs://readme", name: "项目文档", mimeType: "text/markdown" },
    ],
  };
});
```

### 2.2 Tools (工具)

**Tools** 是可执行函数，允许 LLM 执行操作（计算、API 调用、数据库查询等）。

#### 特点：
- 需要定义输入参数的 JSON Schema
- LLM 可以"调用"这些工具来执行实际操作
- 支持进度跟踪和取消操作

#### 使用场景：
```typescript
// 示例：数据库查询工具
{
  name: "query_database",
  description: "执行 SQL 查询",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string", description: "SQL 查询语句" },
    },
    required: ["sql"],
  },
}
```

### 2.3 Prompts (提示模板)

**Prompts** 是预定义的模板，帮助用户以一致的方式与模型交互。

#### 特点：
- 可以接受动态参数
- 可以包含资源上下文
- 支持多轮对话模板

#### 使用场景：
```typescript
// 示例：代码审查提示模板
{
  name: "code-review",
  description: "代码审查模板",
  arguments: [
    { name: "code", description: "要审查的代码", required: true },
    { name: "language", description: "编程语言", required: true },
  ],
}
```

### 2.4 Notifications (通知)

**Notifications** 允许服务器主动向客户端发送消息，无需等待请求。

#### 常见通知类型：

| 通知方法 | 描述 |
|----------|------|
| `notifications/message` | 日志消息（debug/info/warning/error） |
| `notifications/resources/updated` | 资源已更新 |
| `notifications/tools/list_changed` | 工具列表已变更 |
| `notifications/prompts/list_changed` | 提示列表已变更 |
| `notifications/progress` | 进度更新 |

#### 使用示例：
```typescript
await server.notification({
  method: "notifications/message",
  params: {
    level: "info",
    logger: "my-server",
    data: "操作已完成",
  },
});
```

### 2.5 Sampling (采样)

**Sampling** 允许服务器请求客户端的 AI 应用程序执行 LLM 补全。

#### 使用场景：
- 服务器需要 LLM 能力但不想依赖特定模型
- 保持模型无关性，不引入 LLM SDK

```typescript
// 服务器请求客户端进行 LLM 采样
const result = await client.request({
  method: "sampling/createMessage",
  params: {
    messages: [{ role: "user", content: { type: "text", text: "Hello" } }],
  },
}, CompleteResultSchema);
```

### 2.6 Elicitation (信息请求)

**Elicitation** 允许服务器向用户请求额外信息。

#### 两种模式：
1. **Form Elicitation**：通过结构化表单收集非敏感信息
2. **URL Elicitation**：引导用户在浏览器中完成安全流程（如 OAuth）

---

## 3. 创建基本 MCP 服务器

### 3.1 环境准备

```bash
# 创建项目目录
mkdir mcp-example && cd mcp-example
npm init -y

# 安装依赖
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node

# 初始化 TypeScript
npx tsc --init
```

### 3.2 最小示例代码

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. 创建服务器实例
const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 2. 定义工具处理器
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "hello",
    description: "Say hello",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Your name" },
      },
      required: ["name"],
    },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "hello") {
    const { name } = request.params.arguments as { name: string };
    return {
      content: [{ type: "text", text: `Hello, ${name}!` }],
    };
  }
  throw new Error("Unknown tool");
});

// 3. 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3.3 完整示例说明

本项目提供了完整的示例代码：

| 文件 | 说明 |
|------|------|
| `src/server.ts` | 完整的服务器实现，包含 Resources、Tools、Prompts、Notifications |
| `src/client.ts` | 客户端示例，演示如何连接和使用服务器 |

### 3.4 运行示例

```bash
# 编译 TypeScript
npm run build

# 运行服务器
npm run server

# 在另一个终端运行客户端
npm run client
```

---

## 4. Tool 定义方式

### 4.1 基本结构

```typescript
{
  name: "tool_name",           // 工具名称（唯一标识）
  description: "工具描述",      // 描述工具功能（LLM 会阅读）
  inputSchema: {               // JSON Schema 定义输入参数
    type: "object",
    properties: { ... },
    required: ["param1"],
  },
}
```

### 4.2 常用参数类型

```typescript
// 字符串参数
{
  type: "string",
  description: "描述",
  enum: ["option1", "option2"],  // 可选：限制枚举值
}

// 数值参数
{
  type: "number",
  description: "描述",
  minimum: 0,
  maximum: 100,
}

// 布尔参数
{
  type: "boolean",
  description: "描述",
  default: false,
}

// 数组参数
{
  type: "array",
  items: { type: "string" },
  description: "字符串数组",
}

// 对象参数
{
  type: "object",
  properties: {
    field1: { type: "string" },
    field2: { type: "number" },
  },
}
```

### 4.3 工具返回格式

```typescript
// 文本内容
return {
  content: [
    { type: "text", text: "返回的文本内容" },
  ],
};

// 图片内容（base64 编码）
return {
  content: [
    { 
      type: "image", 
      data: "base64encoded...", 
      mimeType: "image/png" 
    },
  ],
};
```

### 4.4 使用 Zod 进行类型安全定义

```typescript
import { z } from "zod";

// 定义 Schema
const CalculatorSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  a: z.number().describe("第一个操作数"),
  b: z.number().describe("第二个操作数"),
});

// 转换为 JSON Schema
const inputSchema = zodToJsonSchema(CalculatorSchema);
```

---

## 5. 错误处理最佳实践

### 5.1 MCP 错误代码

| 错误代码 | 含义 | 使用场景 |
|----------|------|----------|
| `ParseError` | JSON 解析错误 | 请求格式无效 |
| `InvalidRequest` | 无效请求 | 参数错误、资源不存在 |
| `MethodNotFound` | 方法不存在 | 调用了未实现的工具 |
| `InvalidParams` | 无效参数 | 参数类型不匹配 |
| `InternalError` | 内部错误 | 服务器内部异常 |

### 5.2 错误处理示例

```typescript
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await executeTool(request.params);
    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    // 转换已知错误
    if (error instanceof McpError) {
      throw error;
    }
    
    // 业务逻辑错误
    if (error instanceof ValidationError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `参数验证失败: ${error.message}`
      );
    }
    
    // 未知错误：记录详细信息，返回通用消息
    console.error("Tool execution failed:", error);
    throw new McpError(
      ErrorCode.InternalError,
      "工具执行失败，请稍后重试"
    );
  }
});
```

### 5.3 最佳实践建议

1. **不要暴露敏感信息**：向客户端返回错误时，避免包含内部路径或敏感数据
2. **使用适当的错误代码**：帮助客户端理解错误类型
3. **记录详细错误**：在服务器端记录完整错误信息以便调试
4. **优雅降级**：通知失败不应影响主要功能

---

## 6. 配置文件格式

### 6.1 Claude Desktop 配置

Claude Desktop 使用 JSON 配置文件来管理 MCP 服务器：

**Windows:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\username\\Documents"]
    },
    "my-custom-server": {
      "command": "node",
      "args": ["C:\\path\\to\\server.js"]
    }
  }
}
```

**macOS/Linux:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
    }
  }
}
```

### 6.2 配置文件结构

```typescript
interface McpConfig {
  mcpServers: {
    [serverName: string]: {
      // 启动命令
      command: string;
      // 命令参数
      args?: string[];
      // 环境变量
      env?: Record<string, string>;
      // 工作目录
      cwd?: string;
    };
  };
}
```

### 6.3 环境变量配置

```json
{
  "mcpServers": {
    "api-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "your-api-key",
        "DATABASE_URL": "postgresql://localhost/mydb"
      }
    }
  }
}
```

---

## 7. 进阶主题

### 7.1 能力协商 (Capability Negotiation)

MCP 在连接初始化时会协商双方支持的能力：

```typescript
const server = new Server(
  { name: "my-server", version: "1.0.0" },
  {
    capabilities: {
      resources: {},      // 支持资源
      tools: {},          // 支持工具
      prompts: {},        // 支持提示
      logging: {},        // 支持日志通知
      // 高级能力
      sampling: {},       // 支持采样（客户端提供）
    },
  }
);
```

### 7.2 进度跟踪

对于长时间运行的工具调用，可以报告进度：

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  const { token } = extra;  // 进度令牌
  
  for (let i = 0; i < 10; i++) {
    // 报告进度
    await server.notification({
      method: "notifications/progress",
      params: {
        token,
        progress: i * 10,
        total: 100,
      },
    });
    await delay(1000);
  }
  
  return { content: [{ type: "text", text: "Done" }] };
});
```

### 7.3 传输层选择建议

| 场景 | 推荐传输 | 原因 |
|------|----------|------|
| 本地工具集成 | stdio | 无网络开销，进程隔离 |
| 远程 API 服务 | Streamable HTTP | 标准 HTTP，易于扩展 |
| 需要 SSE 推送 | Streamable HTTP + SSE | 服务器主动推送 |
| 浏览器环境 | HTTP | 浏览器限制 |

---

## 8. 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 规范](https://modelcontextprotocol.io/specification/2025-11-25)
- [官方示例服务器](https://github.com/modelcontextprotocol/servers)

---

## 总结

MCP 提供了一个标准化的方式来连接 LLM 应用与外部数据源和工具。通过理解其核心概念（Resources、Tools、Prompts、Notifications），开发者可以：

1. **构建可复用的服务器**：一次开发，多处使用
2. **保持模型无关性**：不依赖特定 LLM 提供商
3. **实现安全集成**：通过能力协商和用户同意机制
4. **支持多种传输**：根据场景选择 stdio 或 HTTP

这个项目的示例代码 (`src/server.ts` 和 `src/client.ts`) 展示了所有这些概念的实际应用，是入门 MCP 开发的良好起点。
