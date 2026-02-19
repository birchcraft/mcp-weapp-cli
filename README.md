# 微信小程序开发者工具 MCP 服务器

一个完整的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务器实现，封装了微信开发者工具 CLI 的所有功能。

## 功能特性

- 🔧 **完整 CLI 覆盖**: 支持微信开发者工具 CLI 的全部 20+ 个命令
- 🤖 **AI 集成**: 让 AI 助手能够通过自然语言调用小程序开发工具
- 📦 **类型安全**: 使用 TypeScript 开发，提供完整的类型定义
- 🔒 **错误处理**: 完善的错误处理和参数验证
- 📝 **资源与提示符**: 支持 MCP Resources 和 Prompts

## 支持的工具

### 登录管理
- `weapp_login` - 登录微信开发者工具
- `weapp_check_login` - 检查登录状态

### 预览与上传
- `weapp_preview` - 生成预览二维码
- `weapp_auto_preview` - 自动预览
- `weapp_upload` - 上传代码到微信公众平台

### 项目管理
- `weapp_open` - 打开工具/项目
- `weapp_open_other` - 以"其他"模式打开项目
- `weapp_close` - 关闭项目
- `weapp_quit` - 退出工具

### 构建
- `weapp_build_npm` - 构建 npm
- `weapp_clear_cache` - 清除缓存

### 自动化测试
- `weapp_auto` - 开启自动化功能
- `weapp_auto_replay` - 自动化测试回放

### 云开发
- `weapp_cloud_env_list` - 获取云环境列表
- `weapp_cloud_functions_list` - 获取云函数列表
- `weapp_cloud_functions_info` - 获取云函数信息
- `weapp_cloud_functions_deploy` - 部署云函数
- `weapp_cloud_functions_inc_deploy` - 增量部署云函数
- `weapp_cloud_functions_download` - 下载云函数

## 安装

### 前置要求

- Node.js >= 18
- 微信开发者工具（已安装并开启服务端口）

### 使用 npx 运行（推荐）

无需安装，直接使用 npx 运行：

```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "npx",
      "args": ["-y", "@weapp-devtools/mcp"],
      "env": {
        "WEAPP_PORT": "9420",
        "WEAPP_LANG": "zh"
      }
    }
  }
}
```

### 全局安装

```bash
npm install -g @weapp-devtools/mcp
```

### 从源码安装

```bash
# 克隆仓库
git clone <repository-url>
cd weapp-devtools-mcp

# 安装依赖
npm install

# 编译
npm run build
```

## 配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `WEAPP_CLI_PATH` | CLI 工具路径 | 自动检测 |
| `WEAPP_PORT` | HTTP 服务端口 | 9420 |
| `WEAPP_LANG` | 语言 (en/zh) | zh |
| `WEAPP_DEBUG` | 调试模式 | false |

### MCP 客户端配置

#### Claude Desktop / Cursor

编辑配置文件：
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**使用 npx（推荐）：**

```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "npx",
      "args": ["-y", "@weapp-devtools/mcp"],
      "env": {
        "WEAPP_PORT": "9420",
        "WEAPP_LANG": "zh"
      }
    }
  }
}
```

**使用本地路径：**

```json
{
  "mcpServers": {
    "weapp-devtools": {
      "command": "node",
      "args": ["D:\\Projects\\WeappMCP\\dist\\index.js"],
      "env": {
        "WEAPP_PORT": "9420",
        "WEAPP_LANG": "zh"
      }
    }
  }
}
```

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

## 开发

```bash
# 开发模式（自动编译）
npm run dev

# 运行测试
npm test

# 代码格式化
npm run format

# 代码检查
npm run lint
```

## CLI 路径自动检测

如果没有设置 `WEAPP_CLI_PATH`，服务器会自动检测以下常见路径：

### Windows
- `C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat`
- `C:\Program Files\Tencent\微信web开发者工具\cli.bat`

### macOS
- `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- `/Applications/微信开发者工具.app/Contents/MacOS/cli`

## 文档

- [MCP 基础知识](./docs/MCP基础知识.md)
- [设计方案](./docs/设计方案.md)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)

## 许可证

MIT License
