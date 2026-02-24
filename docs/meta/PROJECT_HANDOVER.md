# 项目交接本

## 基本信息

| 项目 | 内容 |
|------|------|
| **项目名称** | @birchcraft/mcp-weapp-cli |
| **项目描述** | 微信小程序开发者工具 CLI 的 MCP 服务器实现 |
| **版本** | 1.0.1 |
| **许可证** | MIT |
| **作者** | birchcraft |

---

## 关键文件位置

### 源代码
```
src/
├── index.ts              # 主入口，启动 MCP 服务器
├── server.ts             # MCP 服务器核心实现
├── cli-client.ts         # 微信 CLI 调用封装
├── client.ts             # 自动化测试客户端
├── config.ts             # 配置管理
├── types.ts              # 类型定义
├── tools/                # 工具分类实现
│   ├── index.ts          # 工具注册中心
│   ├── auth.ts           # 登录相关
│   ├── preview.ts        # 预览/上传
│   ├── project.ts        # 项目管理
│   ├── build.ts          # 构建相关
│   ├── automation.ts     # 自动化测试
│   ├── cloud.ts          # 云开发
│   └── status.ts         # 状态查询
└── utils/
    ├── logger.ts         # 日志工具
    └── helpers.ts        # 辅助函数
```

### 编译输出
```
dist/                     # TypeScript 编译输出
├── index.js              # 主入口
├── server.js
├── cli-client.js
└── ...
```

### 测试
```
tests/                    # 单元测试
debug/script/             # 调试测试脚本
  ├── test-simple.js      # 简化测试
  ├── test-mcp.js         # MCP 协议测试
  ├── manual-test.js      # 手动逐个测试
  └── ...
```

### 文档
```
docs/
├── design/               # 设计文档
│   └── 设计方案.md
├── implement/            # 实现文档
│   ├── 测试报告.md
│   └── 发布指南.md
├── reference/            # 参考资料
│   └── MCP基础知识.md
└── meta/                 # 元文档
    ├── AGENT_WORKFLOW.md
    └── PROJECT_HANDOVER.md
```

---

## 环境要求

- **Node.js**: >= 18.0.0
- **微信开发者工具**: 已安装并开启服务端口
- **操作系统**: Windows / macOS

---

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 运行测试
```bash
# 单元测试
npm test

# 手动功能测试
node debug/script/test-simple.js
```

### MCP 配置示例
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

## 已实现功能

### 登录管理 (2个)
- `weapp_login` - 登录微信开发者工具
- `weapp_check_login` - 检查登录状态

### 预览与上传 (3个)
- `weapp_preview` - 生成预览二维码
- `weapp_auto_preview` - 自动预览
- `weapp_upload` - 上传代码到微信公众平台

### 项目管理 (5个)
- `weapp_open` - 打开工具/项目
- `weapp_open_other` - 以"其他"模式打开
- `weapp_close` - 关闭项目
- `weapp_quit` - 退出工具
- `weapp_reset_fileutils` - 重置文件监听

### 构建 (2个)
- `weapp_build_npm` - 构建 npm
- `weapp_clear_cache` - 清除缓存

### 自动化测试 (2个)
- `weapp_auto` - 开启自动化功能
- `weapp_auto_replay` - 自动化测试回放

### 云开发 (6个)
- `weapp_cloud_env_list` - 获取云环境列表
- `weapp_cloud_functions_list` - 获取云函数列表
- `weapp_cloud_functions_info` - 获取云函数信息
- `weapp_cloud_functions_deploy` - 部署云函数
- `weapp_cloud_functions_inc_deploy` - 增量部署云函数
- `weapp_cloud_functions_download` - 下载云函数

**总计: 20 个工具**

---

## 注意事项

1. **微信开发者工具端口**: 默认 9420，需在工具设置中开启
2. **CLI 路径自动检测**: 支持 Windows 和 macOS 常见安装路径
3. **登录状态**: 多数操作需要先登录微信开发者工具
4. **项目路径**: 必须是包含 `project.config.json` 的目录

---

## 常见问题

### Q1: MCP 服务器无法启动
- 检查 Node.js 版本 >= 18
- 检查微信开发者工具端口是否开启

### Q2: CLI 命令执行失败
- 检查微信开发者工具是否已登录
- 检查项目路径是否正确
- 检查 `WEAPP_CLI_PATH` 环境变量（可选）

---

## 待办事项

- [ ] 完善单元测试覆盖率
- [ ] 添加更多错误处理场景
- [ ] 优化日志输出
- [ ] 支持更多 CLI 参数

---

## 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

**最后更新**: 2026-02-24
