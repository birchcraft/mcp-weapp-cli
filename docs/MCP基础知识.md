# MCP (Model Context Protocol) 基础知识

## 一、MCP 概述

MCP (Model Context Protocol) 是 Anthropic 推出的开放协议，用于标准化 AI 助手与外部数据源、工具之间的集成。它提供了一种统一的方式来让 LLM 访问外部资源。

### 1.1 核心设计哲学

- **标准化接口**：统一的协议让不同的 AI 助手都能使用相同的工具
- **安全性**：所有操作都需要用户明确授权
- **可扩展性**：容易添加新的工具和资源
- **双向通信**：支持服务器主动向客户端发送通知

### 1.2 架构模式

```
┌─────────────────┐      MCP Protocol      ┌─────────────────┐
│   MCP Client    │  ◄──────────────────►  │   MCP Server    │
│   (AI 助手)      │   (JSON-RPC 2.0)      │  (工具/数据源)   │
└─────────────────┘                        └─────────────────┘
```

---

## 二、MCP 核心概念

### 2.1 Resources (资源)

资源是服务器提供给客户端的**只读数据**，通过 URI 标识。

**特点：**
- 类似于 REST API 的 GET 请求
- 通过 URI  scheme 命名空间区分不同资源
- 支持二进制数据（通过 mimeType 标识）

**示例：**
```typescript
{
  uri: "weapp://project/config",
  name: "项目配置",
  description: "获取小程序项目配置信息",
  mimeType: "application/json"
}
```

### 2.2 Tools (工具)

工具是可执行函数，允许 LLM 执行操作（计算、API 调用等）。

**特点：**
- 类似于 REST API 的 POST/PUT/DELETE
- 需要明确的用户授权才能执行
- 使用 JSON Schema 定义输入参数
- 有副作用的操作应该定义为 Tool

**定义示例：**
```typescript
{
  name: "weapp_login",
  description: "登录微信开发者工具",
  inputSchema: {
    type: "object",
    properties: {
      qrFormat: {
        type: "string",
        enum: ["terminal", "image", "base64"],
        description: "二维码格式"
      }
    },
    required: []
  }
}
```

### 2.3 Prompts (提示符)

预定义的提示模板，帮助用户与模型交互。

**特点：**
- 可参数化的模板
- 用于引导用户完成特定任务
- 支持参数注入

**示例：**
```typescript
{
  name: "weapp_deploy_guide",
  description: "小程序发布指南",
  arguments: [
    { name: "version", required: true },
    { name: "desc", required: true }
  ]
}
```

### 2.4 Notifications (通知)

服务器主动向客户端发送的消息。

**常见通知类型：**
- `notifications/resources/updated` - 资源更新
- `notifications/tools/list_changed` - 工具列表变化
- `notifications/prompts/list_changed` - 提示符列表变化
- `notifications/progress` - 进度更新
- `notifications/message` - 日志消息

### 2.5 Sampling (采样)

服务器请求客户端进行 LLM 补全的能力。允许服务器在需要时向 AI 请求生成内容。

---

## 三、MCP 协议细节

### 3.1 传输层

**stdio 传输：**
```typescript
// 标准输入输出传输
const transport = new StdioServerTransport();
await server.connect(transport);
```

**HTTP/SSE 传输：**
```typescript
// HTTP + Server-Sent Events
const transport = new SSEServerTransport("/sse", response);
await server.connect(transport);
```

### 3.2 JSON-RPC 2.0 消息格式

**请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "weapp_login",
    "arguments": { "qrFormat": "terminal" }
  }
}
```

**成功响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      { "type": "text", "text": "登录成功" }
    ]
  }
}
```

**错误响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

### 3.3 协议版本

当前 MCP 协议版本：`2024-11-05`

### 3.4 标准错误码

| 错误码 | 含义 |
|--------|------|
| -32700 | Parse error |
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

---

## 四、使用 @modelcontextprotocol/sdk

### 4.1 安装

```bash
npm install @modelcontextprotocol/sdk zod
```

### 4.2 创建 MCP 服务器

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 创建服务器实例
const server = new Server(
  {
    name: "weapp-devtools-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "weapp_login",
        description: "登录微信开发者工具",
        inputSchema: {
          type: "object",
          properties: {
            qrFormat: { type: "string", enum: ["terminal", "base64"] }
          },
          required: []
        }
      }
    ]
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "weapp_login") {
    // 执行登录逻辑
    return {
      content: [{ type: "text", text: "登录成功" }]
    };
  }
  
  throw new Error(`未知工具: ${name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 4.3 资源定义

```typescript
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// 列出资源
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "weapp://cli/status",
        name: "CLI 状态",
        mimeType: "application/json"
      }
    ]
  };
});

// 读取资源
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === "weapp://cli/status") {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify({ status: "ready", version: "1.0.0" })
      }]
    };
  }
});
```

### 4.4 提示符定义

```typescript
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "weapp_deploy_guide",
        description: "小程序发布指南",
        arguments: [
          { name: "version", description: "版本号", required: true },
          { name: "desc", description: "版本描述", required: true }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "weapp_deploy_guide") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请帮我发布小程序版本 ${args.version}，描述：${args.desc}`
          }
        }
      ]
    };
  }
});
```

---

## 五、配置 MCP 客户端

### 5.1 Claude Desktop 配置

编辑 `claude_desktop_config.json`：

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%/Claude/claude_desktop_config.json
```

**配置示例：**
```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "node",
      "args": ["D:\\Projects\\WeappMCP\\dist\\index.js"],
      "env": {
        "WEAPP_CLI_PATH": "C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat",
        "WEAPP_PORT": "9420"
      }
    }
  }
}
```

### 5.2 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `WEAPP_CLI_PATH` | CLI 工具路径 | 自动检测 |
| `WEAPP_PORT` | HTTP 服务端口 | 9420 |
| `WEAPP_LANG` | 语言 (en/zh) | zh |
| `WEAPP_DEBUG` | 调试模式 | false |

---

## 六、最佳实践

### 6.1 错误处理

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await executeCommand(request.params);
    return {
      content: [{ type: "text", text: result }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `错误: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true
    };
  }
});
```

### 6.2 超时处理

```typescript
const executeWithTimeout = async (command: string, timeoutMs: number) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`命令执行超时 (${timeoutMs}ms)`));
    }, timeoutMs);
    
    exec(command, (error, stdout) => {
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(stdout);
    });
  });
};
```

### 6.3 日志记录

```typescript
server.onerror = (error) => {
  console.error("[MCP Error]", error);
};

// 使用 stderr 输出日志，避免干扰 stdout 的 MCP 通信
console.error = (...args) => {
  process.stderr.write(args.join(' ') + '\n');
};
```

### 6.4 类型安全

使用 Zod 进行参数验证：

```typescript
import { z } from "zod";

const LoginSchema = z.object({
  qrFormat: z.enum(["terminal", "image", "base64"]).optional(),
  qrOutput: z.string().optional()
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = LoginSchema.parse(request.params.arguments);
  // 类型安全的 args
});
```

---

## 七、调试技巧

### 7.1 查看 MCP 服务器日志

Claude Desktop 日志位置：
- **macOS**: `~/Library/Logs/Claude/mcp*.log`
- **Windows**: `%APPDATA%/Claude/logs/mcp*.log`

### 7.2 手动测试服务器

```bash
# 启动服务器
node dist/index.js

# 发送 JSON-RPC 请求
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### 7.3 使用 MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 八、参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [JSON-RPC 2.0 规范](https://www.jsonrpc.org/specification)
