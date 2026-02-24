# 项目交接本 - WeappMCP

> 本文档记录开发历程和重要信息，供 Agent 交接使用。
> 
> **文档结构**:
> - 第一部分：重要信息（必读）
> - 第二部分：开发日志（按时间线记录）

---

## 第一部分：重要信息

### 项目背景

本项目是 **微信小程序开发者工具 CLI 的 MCP 服务器实现**，使 AI 助手能够通过 Model Context Protocol (MCP) 调用小程序开发工具。

**核心定位**:
- 为 MCP 客户端（Claude Desktop、Cursor 等）提供标准化的微信开发者工具接口
- 封装微信 CLI 全部 20+ 个命令
- 支持登录、预览、上传、构建、自动化测试、云开发等功能

### 当前状态（截至最后更新）

| 维度 | 状态 |
|------|------|
| 版本 | v1.0.1 |
| 主要分支 | main |
| 已封装工具 | 22 个 |
| 已知问题 | 见下文"遗留问题" |

### 关键技术决策

#### 1. CLI V2 版本支持
**决策时间**: 2026-02-24  
**原因**: 微信开发者工具自 `1.02.202003092` 开始升级 CLI & HTTP 接口到 V2 版本，旧版命令已废弃  
**实现**: 所有命令均采用 V2 格式（如 `cli login` 而非 `cli -l`）  
**参考文档**: https://developers.weixin.qq.com/minigame/dev/devtools/cli.html

#### 2. 统一错误处理模式
**决策时间**: 2026-02-24  
**实现**: 每个工具函数采用 try-catch + success 判断的双重保护  
**代码模式**:
```typescript
try {
  const result = await cliClient.xxx();
  if (result.success) {
    return { content: [{ type: 'text', text: '✓ 成功' }] };
  } else {
    return { content: [...], isError: true };
  }
} catch (error) {
  return { content: [...], isError: true };
}
```

#### 3. MCP 通信规范
**决策时间**: 2026-02-24  
**约束**: 
- 使用 stdio（标准输入输出）进行 MCP 通信
- 日志必须输出到 stderr，避免干扰 stdout 的 MCP 通信
- 工具错误返回 `isError: true`，而非抛出异常

### 遗留问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| CLI 客户端过厚 | 500+ 行，每个命令独立方法但逻辑相似 | 中 |
| 无测试覆盖 | tests/ 目录为空 | 中 |

### 关键文件速查

| 用途 | 路径 |
|------|------|
| 当前文档 | `docs/meta/PROJECT_HANDOVER.md` |
| 工作规范 | `docs/meta/AGENT_WORKFLOW.md` |
| 工具注册中心 | `src/tools/index.ts` |
| CLI 客户端 | `src/cli-client.ts` |
| MCP 服务器 | `src/server.ts` |
| 类型定义 | `src/types.ts` |
| 配置文件 | `src/config.ts` |

---

## 第二部分：开发日志

### 日志说明
- 按时间正序排列（从早到晚）
- 每个条目格式：【时间】类型: 描述

---

### 2026-02-19 项目启动日 - MCP 服务器实现

**【15:20】文档**: 添加 MCP 基础知识和设计方案文档
- 创建 `docs/MCP基础知识.md`
- 创建 `docs/设计方案.md`
- 为项目奠定理论基础

**【15:26】功能**: 实现完整的微信小程序开发者工具 MCP 服务器
- 创建 `src/server.ts` - MCP 服务器核心实现
- 创建 `src/index.ts` - 主入口
- 创建 `src/types.ts` - 类型定义
- 实现 Tools、Resources、Prompts 支持

**【15:26】修复**: 修复工具调用处理器的返回类型
- 统一工具返回格式为 `ToolResult`
- 确保 MCP 协议兼容性

**【15:30】修复**: 修复 CLI 路径自动检测
- 支持从 PATH 环境变量查找 CLI
- 支持 Windows/macOS 常见安装路径自动检测
- 创建 `src/config.ts` 配置管理模块

**【15:33】修复**: 修复 Windows 上执行 .bat 文件的 spawn 问题
- 添加 `shell: true` 选项解决 Windows 执行问题
- 修复参数传递方式

**【15:34】文档**: 添加测试报告文档
- 记录功能测试情况
- 验证工具可用性

**【16:19】功能**: 添加 weapp_reset_fileutils 工具
- 补充遗漏的重置文件监听功能
- 完善项目管理工具集

**【16:19】文档**: 更新测试报告，记录所有功能测试通过
- 验证 20+ 个工具全部正常工作
- 记录测试环境信息

**【16:42】修复**: 修复 Windows 上 CLI 执行问题
- 合并 stdout 和 stderr 输出
- 解决 Windows 上部分输出在 stderr 的问题

**【23:26】功能**: 支持 npm 包发布，修复 build-npm 工具参数兼容性问题
- 添加 `project` 和 `projectPath` 双参数支持
- 准备 npm 发布配置

---

### 2026-02-20 发布准备日

**【11:32】构建**: 重新构建并打包 v1.0.0
- 编译 TypeScript 到 dist/
- 准备发布文件

**【12:17】配置**: 重命名包为 @birchcraft/mcp-weapp-cli
- 从私有包名改为 scoped 包名
- 更新 package.json 配置

**【12:21】配置**: 创建 publish 目录，整理开源所需文件
- 整理发布所需文件结构
- 确保 package.json files 字段正确

**【15:03】配置**: 更新 NPM 包的 GitHub 仓库链接
- 添加 repository、bugs、homepage 字段

**【15:03】版本**: 发布 v1.0.1
- 修复小问题后的补丁版本

---

### 2026-02-24 文档与重构准备日

**【13:59】重构**: 重构项目文件结构
- 优化 src/ 目录组织
- 准备后续代码重构

**【14:00】理解**: 分析项目整体结构，阅读核心代码文件
- 阅读 `README.md` 了解项目概况
- 阅读 `package.json` 了解依赖和脚本
- 阅读 `src/**/*.ts` 理解代码组织

**【14:15】分析**: 代码审查，识别重构机会
- 发现代码重复问题：每个工具都有相似的 error handling
- 发现返回格式不统一：JSON vs 纯文本
- 发现 CLI 客户端过厚：500+ 行需要瘦身
- 发现无测试覆盖：tests/ 目录为空

**【14:30】文档**: 创建 Agent 工作规范
- 创建 `docs/meta/AGENT_WORKFLOW.md`
- 定义项目背景、技术栈、目录结构
- 定义开发规范、测试流程、提交规范
- 添加 CLI 接口约束（来自微信官方文档）

**【14:45】文档**: 创建项目交接本
- 创建 `docs/meta/PROJECT_HANDOVER.md`
- 记录项目背景、当前状态、技术决策
- 记录遗留问题和重构方向

**【15:30】文档**: 重写 README.md
- 添加徽章和目录导航
- 添加项目结构说明
- 添加架构设计文档
- 添加开发指南和贡献指南
- 添加路线图

**涉及文件**:
- `docs/meta/AGENT_WORKFLOW.md` (新建)
- `docs/meta/PROJECT_HANDOVER.md` (新建)
- `README.md` (重写)

**当前重构计划**:
| 优先级 | 重构项 | 说明 |
|--------|--------|------|
| P0 | **统一结果处理器** | 创建 `ResultFormatter` 类，统一输出格式 |
| P0 | **工具基类/装饰器** | 提取公共逻辑，简化工具实现 |
| P1 | **CLI 客户端瘦身** | 使用配置化方式生成 CLI 命令 |
| P1 | **统一参数验证** | 使用 zod 进行参数验证 |
| P2 | **添加测试** | 为核心模块添加单元测试 |
| P2 | **代码结构优化** | 重新组织目录结构 |

---

### 2026-02-24 重构日 - 统一工具执行框架

**【14:35】计划**: 重构项目，修复遗留的代码重复和格式不统一问题

**【14:50】完成**: 重构完成，所有遗留问题解决

#### 已完成
- [x] 创建统一结果处理器 `ResultFormatter` 类
- [x] 创建工具执行包装器，统一错误处理逻辑
- [x] 重构 auth.ts - 使用新框架
- [x] 重构 preview.ts - 使用新框架
- [x] 重构 project.ts - 使用新框架
- [x] 重构 build.ts - 使用新框架
- [x] 重构 automation.ts - 使用新框架
- [x] 重构 cloud.ts - 使用新框架
- [x] 重构 status.ts - 使用新框架
- [x] 编译检查并通过

#### 涉及文件
- `src/utils/result-formatter.ts` (新建) - 统一结果格式化
- `src/utils/tool-wrapper.ts` (新建) - 工具包装器和构建器
- `src/tools/auth.ts` - 使用 ToolBuilder 重构
- `src/tools/preview.ts` - 使用 wrapHandler 重构
- `src/tools/project.ts` - 使用 wrapHandler 重构
- `src/tools/build.ts` - 使用 wrapHandler 重构
- `src/tools/automation.ts` - 简化错误处理
- `src/tools/cloud.ts` - 使用 ToolBuilder 重构
- `src/tools/status.ts` - 简化错误处理

#### 重构成果
1. **消除代码重复**: 所有工具使用统一的错误处理和结果格式化
2. **统一返回格式**: 成功用 `✓`，错误用 `✗`，格式一致
3. **简化工具实现**: 工具只需关注业务逻辑
4. **新增工具构建器**: `createTool()` 提供链式 API 定义工具

#### 新增 API
```typescript
// 结果格式化
import { success, error, fromCLI, json, text } from '../utils/result-formatter.js';

// 工具包装器
import { createTool, createToolHandler, createSimpleToolHandler } from '../utils/tool-wrapper.js';

// 示例：使用 ToolBuilder 创建工具
const myTool = createTool<{ project: string }>('weapp_xxx', '描述')
  .stringParam('project', '项目路径', { required: true })
  .wrapHandler({
    operation: '操作名称',
    executor: async (args) => cliClient.xxx(args.project),
  })
  .build();
```

---

### [模板] - 任务完成记录

**完成时间**: YYYY-MM-DD HH:mm  
**版本**: vX.Y.Z

#### 已完成
- [x] 任务1: [具体描述]
- [x] 任务2: [具体描述]

#### Git 提交记录
```
commit hash - 提交信息
```

#### 测试截图
- `debug/screenshots/xxx.png`

#### 待后续完成
- [ ] 后续任务1
- [ ] 后续任务2

---

## 附录

### 版本号历史

| 版本 | 时间 | 说明 |
|------|------|------|
| v1.0.0 | 2026-02-20 | 首个稳定版本，完整的 MCP 服务器实现 |
| v1.0.1 | 2026-02-20 | 更新 GitHub 仓库链接 |
| v1.0.1+ | 2026-02-24 | 文档完善，准备重构 |

### 工具清单

| 分类 | 数量 | 文件 |
|------|------|------|
| 登录认证 | 2 | `auth.ts` |
| 预览上传 | 3 | `preview.ts` |
| 项目管理 | 5 | `project.ts` |
| 构建 | 2 | `build.ts` |
| 自动化 | 2 | `automation.ts` |
| 云开发 | 6 | `cloud.ts` |
| 状态检测 | 2 | `status.ts` |
| **总计** | **22** | - |

### 参考资源

#### 官方文档
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [微信开发者工具 CLI 文档](https://developers.weixin.qq.com/minigame/dev/devtools/cli.html)
- [MCP SDK 文档](https://github.com/modelcontextprotocol/typescript-sdk)

#### 内部文档
- `README.md` - 项目概述
- `docs/meta/AGENT_WORKFLOW.md` - 工作规范
- `docs/meta/PROJECT_HANDOVER.md` - 本文档

---

**文档最后更新**: 2026-02-24  
**总提交次数**: 16  
**涉及文件**: 20+
