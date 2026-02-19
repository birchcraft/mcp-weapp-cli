# 微信小程序开发者工具 MCP 服务器

一个基于 Model Context Protocol (MCP) 的微信小程序开发者工具服务器，通过 MCP 协议调用微信开发者工具的 CLI 命令，为 AI 助手提供小程序开发能力。

## 功能特性

### 🚀 核心功能

- **登录管理**: 微信开发者工具登录状态管理
- **代码预览**: 生成小程序预览二维码
- **代码上传**: 上传小程序代码到微信平台
- **自动预览**: 自动生成预览二维码
- **npm 构建**: 构建小程序 npm 依赖
- **缓存管理**: 清除开发者工具缓存
- **工具管理**: 启动、关闭开发者工具
- **云开发**: 云函数和云环境管理

### 🛠️ 技术栈

- **Node.js** + **TypeScript**: 现代 JavaScript 开发
- **MCP 协议**: 标准化的模型上下文协议
- **微信开发者工具 CLI**: 官方命令行工具
- **Jest**: 完整的测试覆盖

### 📋 MCP 工具列表

| 工具名称                       | 描述           | 对应 CLI 命令                | 参数                                                          |
| ------------------------------ | -------------- | ---------------------------- | ------------------------------------------------------------- |
| `weapp_login`                  | 登录开发者工具 | `cli login`                  | `qrFormat?`, `qrSize?`, `qrOutput?`, `resultOutput?`          |
| `weapp_check_login`            | 检查登录状态   | `cli islogin`                | 无                                                            |
| `weapp_preview`                | 生成预览二维码 | `cli preview`                | `project`, `qrFormat?`, `qrSize?`, `qrOutput?`, `infoOutput?` |
| `weapp_auto_preview`           | 自动预览       | `cli auto-preview`           | `project`, `infoOutput?`                                      |
| `weapp_upload`                 | 上传代码       | `cli upload`                 | `project`, `version`, `desc?`, `infoOutput?`                  |
| `weapp_build_npm`              | 构建 npm       | `cli build-npm`              | `project`, `compileType?`                                     |
| `weapp_cache_clear`            | 清除缓存       | `cli cache`                  | `project`                                                     |
| `weapp_open_tool`              | 启动工具       | `cli open`                   | `project?`                                                    |
| `weapp_close_project`          | 关闭项目       | `cli close`                  | `project`                                                     |
| `weapp_quit_tool`              | 退出工具       | `cli quit`                   | 无                                                            |
| `weapp_cloud_functions_list`   | 云函数列表     | `cli cloud functions list`   | `project`                                                     |
| `weapp_cloud_functions_deploy` | 部署云函数     | `cli cloud functions deploy` | `project`, `functionName`, `functionPath`                     |

## 快速开始

### 前置要求

1. **安装微信开发者工具**: 从[官方网站](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)下载并安装
2. **开启服务端口**: 在开发者工具的 `设置 -> 安全设置` 中开启服务端口
3. **Node.js 环境**: 需要 Node.js 16+ 版本

### 安装和构建

```bash
# 克隆项目
git clone <repository-url>
cd weapp-devtools-mcp

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

### MCP 配置

项目提供了两个配置文件：

1. **mcp-config.json**: 实际使用的配置文件，包含正确的绝对路径
2. **mcp-config-example.json**: 示例配置文件，用作模板

配置文件结构：
```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "node",
      "args": ["/Users/mac/code/tencent/weapp-devtools-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

> **注意**: 请确保 `args` 中的路径指向正确的 `dist/index.js` 文件位置。

### 验证配置

运行配置测试以确保一切正常：

```bash
# 运行配置相关测试
npm test -- --testPathPattern=mcp-config.test.ts

# 手动验证服务器启动
node dist/index.js
```

### 安装和构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
```

### 使用方式

#### 1. 作为 MCP 服务器运行

```bash
# 启动 MCP 服务器
npm start
```

服务器将输出类似以下的日志：
```
[INFO] 注册工具: weapp_login
[INFO] 注册工具: weapp_check_login
[INFO] 注册工具: weapp_preview
...
[INFO] MCP 服务器启动: 微信小程序开发工具 MCP 服务器 v1.0.0
[INFO] 微信小程序 MCP 服务器启动成功
```

#### 2. 功能测试

```bash
# 运行功能测试脚本
node test-mcp.js
```

测试脚本将验证：
- ✅ 14个工具成功注册
- ✅ 2个资源成功注册
- ✅ 2个提示符成功注册

#### 3. 在 AI 客户端中使用

将此 MCP 服务器配置到支持 MCP 协议的 AI 客户端中，即可通过自然语言调用微信小程序开发功能。

示例配置文件 `mcp-config-example.json`：

```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "node",
      "args": ["/path/to/weapp-devtools-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

在支持MCP的AI客户端中，可以通过以下方式调用：

```
请帮我预览微信小程序项目
路径：/path/to/miniprogram
```

AI助手将自动调用 `weapp_preview` 工具，生成预览二维码。

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 使用示例

### 基本用法

```typescript
import WeappMCPClient from './src/index';
import { LogLevel } from './src/types';

// 创建客户端实例
const client = new WeappMCPClient({
  name: 'weapp-devtools-mcp',
  version: '1.0.0',
  logLevel: LogLevel.INFO,
  timeout: 30000,
});

// 启动服务器
await client.start();

// 处理 MCP 请求 - 登录开发者工具
const loginResponse = await client.handleRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'weapp_login',
    arguments: {
      qrFormat: 'terminal',
      qrSize: 'default',
    },
  },
});

// 预览小程序
const previewResponse = await client.handleRequest({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'weapp_preview',
    arguments: {
      project: '/path/to/miniprogram',
      qrFormat: 'terminal',
    },
  },
});

console.log(previewResponse);
```

### 配置说明

#### CLI 工具配置

```typescript
interface CliConfig {
  cliPath?: string; // CLI 工具路径（自动检测）
  port?: number; // 开发者工具服务端口
  lang?: 'en' | 'zh'; // 命令行语言
  debug?: boolean; // 调试模式
}
```

#### 项目配置

```typescript
interface ProjectConfig {
  project: string; // 项目根目录路径
  appid?: string; // 小程序 AppID（可选，从项目配置读取）
  extAppid?: string; // 第三方平台开发时的 AppID
}
```

#### 服务器配置

```typescript
interface ServerConfig {
  name?: string; // 服务器名称
  version?: string; // 服务器版本
  logLevel?: LogLevel; // 日志级别
  timeout?: number; // 请求超时时间（毫秒）
  cliConfig?: CliConfig; // CLI 工具配置
}
```

## 工具详细说明

### 1. 登录开发者工具 (weapp_login)

登录微信开发者工具，支持多种二维码格式。

```json
{
  "name": "weapp_login",
  "arguments": {
    "qrFormat": "terminal",
    "qrSize": "default",
    "qrOutput": "/path/to/qr.png",
    "resultOutput": "/path/to/result.json"
  }
}
```

### 2. 检查登录状态 (weapp_check_login)

检查当前是否已登录开发者工具。

```json
{
  "name": "weapp_check_login",
  "arguments": {}
}
```

### 3. 生成预览二维码 (weapp_preview)

生成小程序预览二维码。

```json
{
  "name": "weapp_preview",
  "arguments": {
    "project": "/path/to/miniprogram",
    "qrFormat": "terminal",
    "qrSize": "default",
    "qrOutput": "/path/to/preview_qr.png",
    "infoOutput": "/path/to/preview_info.json"
  }
}
```

### 4. 自动预览 (weapp_auto_preview)

自动生成预览二维码（需要先登录）。

```json
{
  "name": "weapp_auto_preview",
  "arguments": {
    "project": "/path/to/miniprogram",
    "infoOutput": "/path/to/auto_preview_info.json"
  }
}
```

### 5. 上传代码 (weapp_upload)

上传小程序代码到微信平台。

```json
{
  "name": "weapp_upload",
  "arguments": {
    "project": "/path/to/miniprogram",
    "version": "1.0.0",
    "desc": "新功能发布",
    "infoOutput": "/path/to/upload_info.json"
  }
}
```

### 6. 构建 npm (weapp_build_npm)

构建小程序 npm 依赖。

```json
{
  "name": "weapp_build_npm",
  "arguments": {
    "project": "/path/to/miniprogram",
    "compileType": "miniprogram"
  }
}
```

### 7. 云函数管理 (weapp_cloud_functions_list)

获取云函数列表。

```json
{
  "name": "weapp_cloud_functions_list",
  "arguments": {
    "project": "/path/to/miniprogram"
  }
}
```

### 8. 部署云函数 (weapp_cloud_functions_deploy)

部署云函数到云端。

```json
{
  "name": "weapp_cloud_functions_deploy",
  "arguments": {
    "project": "/path/to/miniprogram",
    "functionName": "hello",
    "functionPath": "cloudfunctions/hello"
  }
}
```

## 错误处理

服务器提供完善的错误处理机制：

- **CLI 工具检测错误**: 自动检测微信开发者工具 CLI 路径，检测失败时提示用户手动配置
- **登录状态错误**: 检查登录状态，未登录时自动引导用户登录
- **项目配置错误**: 验证项目路径和配置文件有效性
- **服务端口错误**: 检测开发者工具服务端口状态，未开启时提醒用户在安全设置中开启
- **命令执行错误**: 处理 CLI 命令执行失败的各种情况
- **超时错误**: 处理命令执行超时情况

### 常见问题排查

1. **MCP 连接错误 "Connection closed"**
   ```bash
   # 确保项目已构建
   npm run build
   
   # 检查配置文件路径
   cat mcp-config.json
   
   # 测试 MCP 服务器
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node dist/index.js
   ```

2. **连接失败**: 请检查开发者工具是否已启动，并在 `设置 -> 安全设置` 中开启服务端口
3. **CLI 工具未找到**: 请确保已正确安装微信开发者工具，或手动指定 CLI 工具路径
4. **项目路径错误**: 请确保项目路径存在且包含有效的 `project.config.json` 文件
5. **登录状态失效**: 请重新执行登录命令

### MCP 服务器调试

启用调试模式：
```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "node",
      "args": ["/path/to/weapp-devtools-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

## 日志系统

支持多级别日志记录：

- `ERROR`: 错误信息
- `WARN`: 警告信息
- `INFO`: 一般信息
- `DEBUG`: 调试信息

```typescript
import { LogLevel } from './src/types';

const client = new WeappMCPClient({
  logLevel: LogLevel.DEBUG, // 设置日志级别
});
```

## 测试

项目包含完整的测试套件：

- **单元测试**: 测试各个组件功能
- **集成测试**: 测试组件间交互
- **模拟测试**: 模拟微信 CI 工具行为

```bash
# 运行所有测试
npm test

# 生成测试覆盖率报告
npm run test:coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

# 安装微信开发者工具 CLI（需要根据实际情况调整）
RUN apk add --no-cache wget unzip

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 环境变量

```bash
# .env
WEAPP_CLI_PATH=/path/to/wechatwebdevtools/cli
WEAPP_DEFAULT_PROJECT=/path/to/default/project
WEAPP_CLI_PORT=9420
WEAPP_CLI_LANG=zh
LOG_LEVEL=INFO
SERVER_TIMEOUT=30000
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 相关链接

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)
- [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 支持

如果您遇到问题或有建议，请：

1. 查看 [Issues](https://github.com/your-username/weapp-devtools-mcp/issues)
2. 创建新的 Issue
3. 联系维护者

---

**注意**: 使用前请确保已正确安装微信开发者工具，并在安全设置中开启服务端口。
