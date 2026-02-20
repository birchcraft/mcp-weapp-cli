# 📦 NPM 包发布指南

## 🚀 快速开始

### 第 1 步：准备工作

#### 1.1 检查包名是否可用

```bash
# 检查包名是否被占用
npm view @weapp-devtools/mcp

# 如果返回 404，说明包名可用 ✅
# 如果有内容，需要修改 package.json 中的 name
```

#### 1.2 确保文件完整

```bash
# 重新构建
npm run build

# 检查 dist 目录是否存在
ls dist/

# 打包测试
npm pack
```

#### 1.3 更新版本号（如果是更新）

```bash
# 如果是第一次发布，保持 1.0.0
# 如果是更新，修改 package.json 中的 version

# 或者用命令
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0
npm version major   # 1.0.0 -> 2.0.0
```

---

### 第 2 步：登录 NPM

```bash
# 登录 npm（需要账号）
npm login

# 按照提示输入：
# - Username: 你的 npm 用户名
# - Password: 你的 npm 密码
# - Email: 你的邮箱
# - Enter one-time password: 邮箱收到的验证码

# 验证登录状态
npm whoami
```

**没有账号？** 去 https://www.npmjs.com/signup 注册

---

### 第 3 步：发布包

```bash
# 进入项目目录
cd D:\Projects\WeappMCP

# 发布（Scoped 包需要 --access public）
npm publish --access public

# 如果失败，可以尝试强制发布（不推荐）
# npm publish --access public --force
```

**发布成功会看到：**
```
+ @weapp-devtools/mcp@1.0.0
```

---

### 第 4 步：验证发布

#### 4.1 在 npm 网站查看

打开：https://www.npmjs.com/package/@weapp-devtools/mcp

应该能看到你的包信息！

#### 4.2 本地测试安装

```bash
# 换一个目录测试
mkdir test-install
cd test-install

# 尝试安装
npm install @weapp-devtools/mcp

# 或者直接用 npx 测试
npx -y @weapp-devtools/mcp
```

#### 4.3 在 Claude/Cursor 中测试

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

重启 Claude/Cursor，检查工具是否加载成功！

---

### 第 5 步：分享给其他人 🎉

#### 方式 1：直接分享配置

告诉朋友复制这段配置到他们的 MCP 设置：

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

#### 方式 2：分享到社区

| 平台 | 分享方式 |
|------|----------|
| **GitHub** | 创建仓库，添加 README，提交到 awesome-mcp |
| **V2EX** | 发帖介绍功能 |
| **知乎** | 写文章介绍实现过程 |
| **Twitter/X** | `@modelcontextprotocol` |
| **Discord** | MCP 官方 Discord 频道 |

#### 方式 3：添加到 MCP 生态列表

向以下仓库提交 PR：
- https://github.com/modelcontextprotocol/servers (官方示例)
- https://github.com/punkpeye/awesome-mcp-servers (社区收集)

---

## 🔧 常见问题

### Q1: 发布失败 "You do not have permission"

```bash
# 检查是否登录正确用户
npm whoami

# 如果不对，登出重登
npm logout
npm login
```

### Q2: 包名已被占用

修改 `package.json`：
```json
{
  "name": "@你的用户名/weapp-devtools-mcp"
}
```

### Q3: 发布后发现 bug

```bash
# 修复后更新版本号
npm version patch

# 重新发布
npm publish --access public
```

### Q4: 如何取消发布

```bash
# 取消发布某个版本（24小时内）
npm unpublish @weapp-devtools/mcp@1.0.0

# 取消整个包（慎重！）
npm unpublish @weapp-devtools/mcp --force
```

---

## 📝 发布前检查清单

- [ ] `npm run build` 成功
- [ ] `npm pack` 生成的文件正确
- [ ] 包名没有被占用
- [ ] 已登录 npm (`npm whoami`)
- [ ] README 有清晰的安装说明
- [ ] package.json 包含正确的 keywords
- [ ] 版本号正确

---

## 🎊 发布成功后

恭喜你！你的包现在可以被全世界使用了：

```bash
# 任何人都可以这样使用
npx -y @weapp-devtools/mcp
```

记得在 GitHub 上给个 ⭐ 支持！
