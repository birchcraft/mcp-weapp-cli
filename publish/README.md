# MCP WeApp CLI

[![npm version](https://badge.fury.io/js/@birchcraft%2Fmcp-weapp-cli.svg)](https://badge.fury.io/js/@birchcraft%2Fmcp-weapp-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

微信小程序开发者工具的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务器实现，让 AI 助手能够通过自然语言调用小程序开发工具的全部功能。

## ✨ 功能特性

- 🔧 **完整 CLI 覆盖** - 支持微信开发者工具 CLI 的全部 20+ 个命令
- 🤖 **AI 集成** - 在 Claude/Cursor 中直接控制小程序开发
- 📦 **类型安全** - TypeScript 开发，完整的类型定义
- 🔒 **安全可靠** - 完善的错误处理和参数验证
- 🚀 **零配置** - 自动检测 CLI 路径，开箱即用

## 📋 支持的功能

| 分类 | 功能 | 工具名 |
|------|------|--------|
| **登录** | 扫码登录、检查登录状态 | `weapp_login`, `weapp_check_login` |
| **预览** | 生成预览二维码、自动预览 | `weapp_preview`, `weapp_auto_preview` |
| **上传** | 上传代码到微信公众平台 | `weapp_upload` |
| **项目管理** | 打开、关闭、重启项目 | `weapp_open`, `weapp_close`, `weapp_reset_fileutils` |
| **构建** | 构建 npm、清除缓存 | `weapp_build_npm`, `weapp_clear_cache` |
| **云开发** | 云函数部署、环境管理 | `weapp_cloud_functions_*`, `weapp_cloud_env_*` |
| **自动化** | 开启自动化测试 | `weapp_auto`, `weapp_auto_replay` |

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- 微信开发者工具（已安装并开启服务端口）

### 安装使用

#### 方式 1：npx 运行（推荐）

在 Claude Desktop 或 Cursor 的配置中添加：

```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "npx",
      "args": ["-y", "@birchcraft/mcp-weapp-cli"],
      "env": {
        "WEAPP_PORT": "9420",
        "WEAPP_LANG": "zh"
      }
    }
  }
}
```

#### 方式 2：全局安装

```bash
npm install -g @birchcraft/mcp-weapp-cli
```

#### 方式 3：本地开发

```bash
git clone https://github.com/birchcraft/mcp-weapp-cli.git
cd mcp-weapp-cli
npm install
npm run build
npm start
```

## 💡 使用示例

在支持 MCP 的 AI 助手（如 Claude）中，你可以这样使用：

```
帮我登录微信开发者工具
```

```
为项目 D:\Projects\MyMiniApp 生成预览二维码
```

```
部署云函数 quickstartFunctions 到环境 xxx
```

```
构建 npm 并上传版本 1.0.0，描述"修复已知问题"
```

## ⚙️ 配置选项

通过环境变量配置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `WEAPP_CLI_PATH` | CLI 工具路径 | 自动检测 |
| `WEAPP_PORT` | HTTP 服务端口 | 9420 |
| `WEAPP_LANG` | 语言 (en/zh) | zh |
| `WEAPP_DEBUG` | 调试模式 | false |

## 🏗️ 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 打包
npm pack
```

## 📄 开源协议

[MIT](LICENSE) © birchcraft
