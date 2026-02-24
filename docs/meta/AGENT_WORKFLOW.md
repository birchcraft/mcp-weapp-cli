# Agent 工作流规范

## 项目概述

**项目名称:** @birchcraft/mcp-weapp-cli  
**项目用途:** 微信小程序开发者工具 CLI 的 MCP (Model Context Protocol) 服务器实现  
**技术栈:** TypeScript, Node.js, MCP SDK

本项目封装了微信开发者工具 CLI 的全部功能，使 AI 助手能够通过自然语言调用小程序开发工具的各项能力。

---

## 开发工作流程

### 1. 代码修改流程

```
src/                 # 修改源代码
  ├── index.ts       # 主入口
  ├── server.ts      # MCP 服务器实现
  ├── cli-client.ts  # CLI 调用封装
  ├── tools/         # 工具分类实现
  └── utils/         # 工具函数
```

### 2. 编译流程

```bash
# 开发模式（自动编译）
npm run dev

# 生产构建
npm run build
```

编译输出目录: `dist/`

### 3. 测试流程

```bash
# 单元测试
npm test

# 手动功能测试
debug/script/test-simple.js
debug/script/manual-test.js
```

### 4. 文档更新流程

```
docs/
  ├── design/        # 设计文档（架构、方案）
  ├── implement/     # 实现文档（测试报告、API文档）
  ├── reference/     # 参考资料（MCP基础、CLI文档）
  └── meta/          # 元文档（本目录）
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 编译 TypeScript |
| `npm run dev` | 开发模式（监视） |
| `npm start` | 运行编译后的服务器 |
| `npm test` | 运行单元测试 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |

---

## 代码规范

### 文件命名
- TypeScript 源文件: 小写驼峰 `.ts`
- 测试文件: `{name}.test.ts`
- 工具模块: 按功能分类在 `tools/` 目录

### 代码风格
- 使用 TypeScript 严格模式
- 异步函数使用 `async/await`
- 错误处理使用 try-catch
- 使用 Zod 进行参数验证

---

## Git 工作流

### 提交规范
```
<type>: <subject>

<body>

type:
  - feat: 新功能
  - fix: 修复
  - docs: 文档
  - style: 格式
  - refactor: 重构
  - test: 测试
  - chore: 构建/工具
```

### 分支策略
- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

---

## 发布流程

详见 `docs/implement/发布指南.md`

1. 更新版本号 (`npm version`)
2. 运行测试
3. 构建
4. 发布到 npm
5. 创建 Git Tag

---

## 注意事项

1. **环境变量**: 使用 `.env` 或环境变量配置 `WEAPP_PORT`, `WEAPP_CLI_PATH` 等
2. **CLI 路径**: Windows 下自动检测常见安装路径
3. **端口占用**: 微信开发者工具默认使用 9420 端口
4. **登录状态**: 多数操作需要先登录微信开发者工具

---

## 参考链接

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)
- [设计方案](./design/设计方案.md)
