# 微信小程序开发者工具 MCP 服务器

<p align="center">
  <strong>一个完整的 Model Context Protocol (MCP) 服务器实现</strong><br>
  封装微信开发者工具 CLI 的全部功能，让 AI 助手能够调用小程序开发工具
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@birchcraft/mcp-weapp-cli">
    <img src="https://img.shields.io/npm/v/@birchcraft/mcp-weapp-cli.svg" alt="npm version">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="node version">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </a>
</p>

---

## 功能特性

- 🔧 **完整 CLI 覆盖**: 支持微信开发者工具 CLI 的全部 20+ 个命令
- 🤖 **AI 集成**: 让 AI 助手能够通过自然语言调用小程序开发工具
- 📦 **类型安全**: 使用 TypeScript 开发，提供完整的类型定义
- 🔒 **错误处理**: 完善的错误处理和参数验证
- 📝 **资源与提示符**: 支持 MCP Resources 和 Prompts
- 🌐 **跨平台**: 支持 Windows、macOS 和 Linux

---

## 目录

- [功能特性](#功能特性)
- [支持的工具](#支持的工具)
- [快速开始](#快速开始)
- [安装](#安装)
- [配置](#配置)
- [使用示例](#使用示例)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)
- [文档](#文档)
- [许可证](#许可证)

---

## 支持的工具

### 登录管理
| 工具名称 | 描述 |
|---------|------|
| `weapp_login` | 登录微信开发者工具（支持二维码终端显示/图片/Base64） |
| `weapp_check_login` | 检查当前登录状态 |

### 预览与上传
| 工具名称 | 描述 |
|---------|------|
| `weapp_preview` | 生成预览二维码，用于在真机上预览小程序 |
| `weapp_auto_preview` | 自动预览，自动打开 IDE 并生成二维码 |
| `weapp_upload` | 上传代码到微信公众平台，用于提交审核或发布体验版 |

### 项目管理
| 工具名称 | 描述 |
|---------|------|
| `weapp_open` | 打开微信开发者工具或指定项目 |
| `weapp_open_other` | 以独立窗口模式打开项目 |
| `weapp_close` | 关闭指定项目或当前项目 |
| `weapp_quit` | 完全退出微信开发者工具 |
| `weapp_reset_fileutils` | 重置文件监听，解决文件监听失效问题 |

### 构建
| 工具名称 | 描述 |
|---------|------|
| `weapp_build_npm` | 构建 npm 包，将 node_modules 构建为小程序可用模块 |
| `weapp_clear_cache` | 清除开发者工具缓存（数据/文件/编译/授权/网络/会话） |

### 自动化测试
| 工具名称 | 描述 |
|---------|------|
| `weapp_auto` | 开启自动化功能，启用 WebSocket 控制接口 |
| `weapp_auto_replay` | 执行自动化测试回放 |

### 云开发
| 工具名称 | 描述 |
|---------|------|
| `weapp_cloud_env_list` | 获取云开发环境列表 |
| `weapp_cloud_functions_list` | 获取指定环境下的云函数列表 |
| `weapp_cloud_functions_info` | 获取云函数详细信息 |
| `weapp_cloud_functions_deploy` | 部署云函数到云端 |
| `weapp_cloud_functions_inc_deploy` | 增量部署云函数（更快） |
| `weapp_cloud_functions_download` | 从云端下载云函数代码 |

### 状态检测
| 工具名称 | 描述 |
|---------|------|
| `weapp_status` | 检测开发者工具运行状态、端口信息、进程情况 |
| `weapp_kill_all` | 强制关闭所有开发者工具实例 |

---

## 快速开始

### 前置要求

- Node.js >= 18
- 微信开发者工具（已安装并开启服务端口）

### 使用 npx 运行（推荐）

无需安装，直接在 MCP 客户端配置中使用：

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

---

## 安装

### 全局安装

```bash
npm install -g @birchcraft/mcp-weapp-cli
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/birchcraft/mcp-weapp-cli.git
cd mcp-weapp-cli

# 安装依赖
npm install

# 编译
npm run build

# 创建到源码的链接（可选）
npm link
```

---

## 配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `WEAPP_CLI_PATH` | CLI 工具路径 | 自动检测 |
| `WEAPP_PORT` | HTTP 服务端口 | 9420 |
| `WEAPP_LANG` | 语言 (en/zh) | zh |
| `WEAPP_DEBUG` | 调试模式 | false |

### CLI 路径自动检测

如果没有设置 `WEAPP_CLI_PATH`，服务器会自动检测以下常见路径：

**Windows:**
- `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`
- `C:\Program Files\Tencent\微信web开发者工具\cli.bat`
- `%USERPROFILE%\AppData\Local\微信开发者工具\cli.bat`

**macOS:**
- `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- `/Applications/微信开发者工具.app/Contents/MacOS/cli`

### MCP 客户端配置

#### Claude Desktop

编辑配置文件：
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

#### Cursor

在 Cursor 设置中找到 MCP 配置，添加上述相同的配置。

---

## 使用示例

### 登录开发者工具

```
使用 weapp_login 工具登录微信开发者工具
```

### 预览项目

```
使用 weapp_preview 工具为项目 D:\Projects\MyMiniApp 生成预览二维码
```

### 上传代码

```
使用 weapp_upload 工具上传项目 D:\Projects\MyMiniApp，版本 1.0.0，描述 "初始版本"
```

### 构建 npm

```
使用 weapp_build_npm 工具为项目 D:\Projects\MyMiniApp 构建 npm
```

---

## 项目结构

```
mcp-weapp-cli/
├── src/                          # 源代码目录
│   ├── index.ts                  # 主入口，服务器启动
│   ├── server.ts                 # MCP 服务器核心实现
│   ├── cli-client.ts             # CLI 客户端，封装微信 CLI 调用
│   ├── config.ts                 # 配置管理（环境变量、自动检测）
│   ├── types.ts                  # TypeScript 类型定义
│   ├── client.ts                 # MCP 客户端示例（用于测试）
│   ├── tools/                    # 工具定义（按功能分类）
│   │   ├── index.ts              # 工具注册中心，聚合所有工具
│   │   ├── auth.ts               # 登录认证工具（login, check_login）
│   │   ├── preview.ts            # 预览上传工具（preview, auto-preview, upload）
│   │   ├── project.ts            # 项目管理工具（open, close, quit）
│   │   ├── build.ts              # 构建工具（build-npm, clear-cache）
│   │   ├── automation.ts         # 自动化测试工具（auto, auto-replay）
│   │   ├── cloud.ts              # 云开发工具（cloud functions）
│   │   └── status.ts             # 状态检测工具（status, kill-all）
│   └── utils/                    # 工具函数
│       ├── helpers.ts            # 辅助函数（路径验证、参数构建等）
│       └── logger.ts             # 日志模块
├── dist/                         # TypeScript 编译输出
├── docs/                         # 文档目录
│   └── meta/                     # 元文档
│       ├── AGENT_WORKFLOW.md     # Agent 工作规范
│       └── PROJECT_HANDOVER.md   # 项目交接本
├── tests/                        # 测试目录（待补充）
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置
├── README.md                     # 本文件
└── LICENSE                       # MIT 许可证
```

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Client                             │
│              (Claude Desktop / Cursor / etc.)               │
└───────────────────────┬─────────────────────────────────────┘
                        │ JSON-RPC / stdio
┌───────────────────────▼─────────────────────────────────────┐
│                   MCP Server                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Tools     │  │  Resources   │  │      Prompts        │ │
│  │  (22 tools) │  │(CLI status,  │  │ (setup guide,       │ │
│  │             │  │ config)      │  │  deploy checklist)  │ │
│  └──────┬──────┘  └──────────────┘  └─────────────────────┘ │
│         │                                                   │
│  ┌──────▼────────────────────────────────────────────────┐  │
│  │              CLI Client (@birchcraft/mcp-weapp-cli)   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ ConfigMgr   │  │   CLIExec    │  │  PathDetect  │  │  │
│  │  │(env/args)   │  │(spawn proc)  │  │(auto detect) │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │  │
│  └───────────────────────┬────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │ stdio
┌──────────────────────────▼──────────────────────────────────┐
│            WeChat DevTools CLI (cli.bat / cli)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              WeChat DevTools IDE                            │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块说明

| 模块 | 职责 | 关键文件 |
|------|------|----------|
| **MCP Server** | 处理 MCP 协议通信，管理 Tools/Resources/Prompts | `server.ts` |
| **CLI Client** | 封装微信 CLI 调用，管理进程生命周期 | `cli-client.ts` |
| **Config Manager** | 管理配置，自动检测 CLI 路径 | `config.ts` |
| **Tools** | 实现具体工具逻辑，按功能分类 | `tools/*.ts` |
| **Utils** | 辅助函数，日志、验证等 | `utils/*.ts` |

### 工具分类架构

```
tools/
├── auth.ts          # 认证类工具
├── preview.ts       # 预览发布类工具
├── project.ts       # 项目管理类工具
├── build.ts         # 构建类工具
├── automation.ts    # 自动化测试类工具
├── cloud.ts         # 云开发类工具
└── status.ts        # 状态检测类工具
```

---

## 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/birchcraft/mcp-weapp-cli.git
cd mcp-weapp-cli

# 安装依赖
npm install

# 编译
npm run build
```

### 开发命令

```bash
# 开发模式（自动编译）
npm run dev

# 运行测试
npm test

# 代码格式化
npm run format

# 代码检查
npm run lint

# 构建发布
npm run build
```

### 添加新工具

1. **阅读微信 CLI 文档**，确认命令参数
2. **更新 `types.ts`**，添加相关类型定义
3. **更新 `cli-client.ts`**，添加 CLI 调用方法
4. **创建/修改工具文件**（`src/tools/xxx.ts`）
5. **注册到 `tools/index.ts`**，导出工具定义
6. **编译检查**：`npm run build`
7. **本地测试**：启动服务器验证
8. **更新文档**：README.md 等

详细步骤参考 [Agent 工作规范](./docs/meta/AGENT_WORKFLOW.md)

---

## 贡献指南

我们欢迎所有形式的贡献，无论是新功能、bug 修复还是文档改进。

### 提交 Issue

如果你发现了 bug 或有功能建议，请通过 GitHub Issues 提交：

1. 检查是否已有相关 issue
2. 使用清晰的标题描述问题
3. 提供复现步骤（如果是 bug）
4. 说明期望的行为

### 提交 Pull Request

1. **Fork 仓库** 并创建你的分支 (`git checkout -b feature/amazing-feature`)
2. **提交修改** (`git commit -m 'feat: add amazing feature'`)
3. **推送到分支** (`git push origin feature/amazing-feature`)
4. **创建 Pull Request**

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**Scope 范围:**
- `tools`: 工具相关
- `cli`: CLI 客户端
- `server`: MCP 服务器
- `types`: 类型定义
- `utils`: 工具函数

### 代码规范

- 使用 TypeScript 编写代码
- 遵循现有代码风格
- 为新功能添加类型定义
- 确保 `npm run build` 编译通过

---

## 文档

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/minigame/dev/devtools/cli.html)
- [Agent 工作规范](./docs/meta/AGENT_WORKFLOW.md) - 项目内部开发规范
- [项目交接本](./docs/meta/PROJECT_HANDOVER.md) - 开发日志和遗留问题

---

## 路线图

- [x] 完整的 CLI V2 命令支持
- [x] 统一的错误处理和结果格式化
- [ ] 添加单元测试覆盖
- [ ] 优化 CLI 客户端架构
- [ ] 支持更多自动化测试功能
- [ ] 完善中文/英文文档

---

## 许可证

[MIT](LICENSE) License

Copyright (c) 2024 birchcraft

---

<p align="center">
  如果这个项目对你有帮助，请给我们一个 ⭐️ Star！
</p>
