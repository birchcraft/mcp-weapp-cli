# Agent 工作规范 - WeappMCP

> 本文档定义 AI Agent 在该项目中的工作流程、操作规范和质量标准。
> 
> **适用项目**: WeappMCP - 微信小程序开发者工具 MCP 服务器  
> **文档版本**: v1.0  
> **最后更新**: 2026-02-24

---

## 一、项目背景与约束

### 1.1 项目性质

本项目是 **Model Context Protocol (MCP) 服务器** 实现，封装了微信开发者工具 CLI 的全部功能，使 AI 助手能够通过自然语言调用小程序开发工具。

**核心职责**:
- 提供 20+ 个 MCP 工具，覆盖 CLI 所有命令
- 支持登录、预览、上传、构建、自动化测试、云开发等功能
- 为 MCP 客户端（如 Claude Desktop、Cursor）提供标准化的工具接口

### 1.2 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | >= 18 |
| 语言 | TypeScript | 5.3+ |
| 模块系统 | ES Modules | Node16 |
| 协议 | MCP SDK | ^1.6.0 |
| 校验 | Zod | ^3.22.4 |

### 1.3 关键目录

```
WeappMCP/
├── src/                   # ⭐ 源代码（在此开发）
│   ├── tools/             # 工具定义（按功能分类）
│   │   ├── auth.ts        # 登录认证工具
│   │   ├── preview.ts     # 预览/上传工具
│   │   ├── project.ts     # 项目管理工具
│   │   ├── build.ts       # 构建相关工具
│   │   ├── automation.ts  # 自动化测试工具
│   │   ├── cloud.ts       # 云开发工具
│   │   ├── status.ts      # 状态检测工具
│   │   └── index.ts       # 工具注册中心
│   ├── cli-client.ts      # CLI 客户端
│   ├── server.ts          # MCP 服务器核心
│   ├── config.ts          # 配置管理
│   ├── types.ts           # 类型定义
│   ├── utils/             # 工具函数
│   │   ├── helpers.ts     # 辅助函数
│   │   └── logger.ts      # 日志模块
│   └── index.ts           # 主入口
├── dist/                  # 编译输出
├── docs/                  # 文档
│   └── meta/              # 元文档
│       └── AGENT_WORKFLOW.md   # 本文档
├── tests/                 # 测试目录（待补充）
├── package.json           # 包配置
└── tsconfig.json          # TypeScript 配置
```

### 1.4 MCP 协议约束

在开发前，必须了解以下 MCP 协议特有的约束：

1. **通信方式**: 使用 stdio（标准输入输出）进行 MCP 通信，日志必须输出到 stderr
2. **JSON-RPC**: 所有通信遵循 JSON-RPC 2.0 协议
3. **工具定义**: 工具的 `inputSchema` 必须符合 JSON Schema 规范
4. **结果格式**: 工具返回必须使用统一的 `ToolResult` 格式
5. **错误处理**: 工具错误应返回 `isError: true`，而非抛出异常

### 1.5 Weapp CLI 协议约束

参考：https://developers.weixin.qq.com/minigame/dev/devtools/cli.html

---

## 二、工作前准备（必须执行）

### 2.1 文档阅读清单

在每次开始工作前，必须按顺序阅读以下文档：

| 优先级 | 文档 | 路径 | 检查要点 |
|--------|------|------|----------|
| P0 | **README.md** | `README.md` | 项目概述、使用方式、配置说明 |
| P0 | **项目交接本** | `docs/meta/PROJECT_HANDOVER.md` | 上次任务完成情况、待办事项、遗留问题 |
| P1 | **代码结构** | `src/tools/index.ts` | 现有工具列表、分类方式 |
| P1 | **类型定义** | `src/types.ts` | 接口定义、类型约束 |
| P2 | **微信 CLI 文档** | [外部链接](https://developers.weixin.qq.com/minigame/dev/devtools/cli.html) | 微信官方 CLI 文档 |

**交接本阅读要点**:
- 查看「第一部分：重要信息」了解项目背景和当前状态
- 查看「遗留问题」了解已知技术债务
- 查看「第二部分：开发日志」了解历史变更
- 查看「附录：工具清单」了解现有工具覆盖范围

### 2.2 环境与状态检查

执行以下检查命令，确保工作环境正常：

```bash
# 1. 检查 Git 状态
git status
```

**处理规则**:
- 如有未提交的修改 → **必须先提交**，提交后方可开始新任务
- 如有未跟踪的重要文件 → 先添加到 `.gitignore` 或提交

```bash
# 2. 检查当前分支
git branch
```

**分支规范**:
- `main`: 主分支，仅用于发布
- `develop`: 开发分支，日常开发在此分支
- `feature/*`: 功能分支，新功能开发
- `refactor/*`: 重构分支，代码重构

```bash
# 3. 检查编译状态
npm run build
```

**处理规则**:
- 编译报错 → 先解决编译错误再开始新任务
- 类型错误 → 评估是否需要修复

---

## 三、任务执行规范

### 3.1 任务计划登记（操作代码前必须执行）

**在修改任何代码之前**，必须在 `docs/meta/PROJECT_HANDOVER.md` 的**第一部分：项目开发日志**中登记任务计划：

```markdown
### [日期] - 任务计划

**计划人**: Agent  
**计划时间**: YYYY-MM-DD HH:mm

#### 待完成任务
- [ ] 任务1: [具体描述]
- [ ] 任务2: [具体描述]

#### 涉及文件
- `src/tools/xxx.ts`
- `src/cli-client.ts`
- `src/types.ts`

#### 参考依据
- 微信 CLI 文档: [链接或章节]
- 相关 Issue: #xxx
```

### 3.2 开发工作流

#### 新增工具开发流程

```
┌─────────────────┐
│ 1. 阅读微信CLI   │
│    文档确认参数  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 更新types.ts │
│    添加类型定义  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 更新cli-client│
│    添加CLI方法   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 创建/修改工具 │
│    文件         │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 注册到index   │
│    导出工具定义  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. 编译检查      │
│    npm run build │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 7. 本地测试      │
│    启动服务器验证│
└────────┬────────┘
         ▼
┌─────────────────┐
│ 8. 更新文档      │
│    README.md等   │
└─────────────────┘
```

#### 重构开发流程

```
┌─────────────────┐
│ 1. 分析现状      │
│    识别重复代码  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 设计新结构    │
│    保持接口兼容  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 渐进式重构    │
│    小步快跑      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 编译检查      │
│    确保无错误    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 验证功能      │
│    测试关键路径  │
└─────────────────┘
```

### 3.3 交接本使用规范

#### 任务开始前登记

**在修改任何代码之前**，必须在 `docs/meta/PROJECT_HANDOVER.md` 的**第二部分：开发日志**中添加任务计划条目：

```markdown
### [YYYY-MM-DD] - 任务计划

**计划人**: Agent  
**计划时间**: YYYY-MM-DD HH:mm

#### 待完成任务
- [ ] 任务1: [具体描述]
- [ ] 任务2: [具体描述]

#### 涉及文件
- `src/tools/xxx.ts`
- `src/cli-client.ts`

#### 参考依据
- 微信 CLI 文档: [链接]
- 相关 Issue: #xxx
```

#### 任务完成后记录

**在任务完成后**，在开发日志中添加完成记录：

```markdown
### [YYYY-MM-DD] - 任务完成

**完成时间**: YYYY-MM-DD HH:mm  
**版本**: vX.Y.Z

#### 已完成
- [x] 任务1: [具体描述]
- [x] 任务2: [具体描述]

#### Git 提交记录
```
commit hash - 提交信息
```

#### 待后续完成
- [ ] 后续任务1
- [ ] 后续任务2

#### 备注
[重要发现、注意事项等]
```

#### 遗留问题更新

如任务中发现新的遗留问题，更新「第一部分：重要信息」中的遗留问题表格：

```markdown
### 遗留问题

| 问题 | 影响 | 优先级 |
|------|------|--------|
| [新问题描述] | [影响范围] | [高/中/低] |
```

---

## 四、开发规范

### 4.1 代码组织原则

#### 工具文件结构

每个工具文件（如 `src/tools/auth.ts`）应遵循以下结构：

```typescript
/**
 * 功能描述
 */

// 1. 导入
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { formatError } from '../utils/helpers.js';

// 2. 辅助函数（可选）
function formatResult(data: unknown, isError = false): ToolResult {
  // 统一的结果格式化
}

// 3. 工具执行函数
async function executeXxx(args: { ... }): Promise<ToolResult> {
  try {
    // 参数验证
    // 调用 cliClient
    // 格式化结果
  } catch (error) {
    // 统一错误处理
  }
}

// 4. 工具定义
const xxxTool: ToolDefinition = {
  name: 'weapp_xxx',
  description: '...',
  inputSchema: { ... },
  handler: executeXxx,
};

// 5. 导出
export const xxxTools: ToolDefinition[] = [xxxTool];
```

#### 命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 工具文件 | 功能名词 | `auth.ts`, `preview.ts` |
| 工具名称 | `weapp_` + 动词/名词 | `weapp_login`, `weapp_preview` |
| 执行函数 | `execute` + 动词 | `executeLogin`, `executePreview` |
| 类型接口 | PascalCase | `ToolDefinition`, `CLIResult` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_CONFIG` |

### 4.2 错误处理规范

**必须遵循的错误处理模式**:

```typescript
async function executeXxx(args: { ... }): Promise<ToolResult> {
  // 1. 参数前置验证
  if (!isValidProjectPath(args.project)) {
    return {
      content: [{ type: 'text', text: '错误: 无效的项目路径' }],
      isError: true,
    };
  }

  try {
    const result = await cliClient.xxx(...);

    // 2. 根据 CLI 返回码判断
    if (result.success) {
      return {
        content: [{ type: 'text', text: '✓ 操作成功' }],
      };
    } else {
      return {
        content: [{ type: 'text', text: `✗ 操作失败: ${result.stderr}` }],
        isError: true,
      };
    }
  } catch (error) {
    // 3. 异常捕获
    return {
      content: [{ type: 'text', text: `执行失败: ${formatError(error)}` }],
      isError: true,
    };
  }
}
```

### 4.3 结果格式化规范

**统一输出格式**:

```typescript
// 成功格式
{
  content: [{
    type: 'text',
    text: [
      '✓ 操作成功',
      '',
      '📋 详情:',
      `   项目: ${projectPath}`,
      `   其他: xxx`,
      stdout ? `\n输出:\n${stdout}` : ''
    ].filter(Boolean).join('\n')
  }]
}

// 错误格式
{
  content: [{
    type: 'text',
    text: `✗ 操作失败 (退出码: ${code})\n\n${errorMessage}`
  }],
  isError: true
}
```

---

## 五、测试流程规范

### 5.1 本地测试步骤

#### Step 1: 编译检查

```bash
npm run build
```

**成功标准**: 无 TypeScript 编译错误

#### Step 2: 启动服务器测试

```bash
npm start
```

或使用开发模式：

```bash
npm run dev
```

**验证点**:
- 服务器启动无错误
- 输出显示已注册的工具列表

#### Step 3: MCP Inspector 测试（推荐）

使用 MCP Inspector 进行交互式测试：

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

**测试内容**:
- 列出所有工具: `tools/list`
- 调用工具: `tools/call`
- 列出资源: `resources/list`
- 读取资源: `resources/read`

#### Step 4: 集成测试（可选）

如需测试与真实微信开发者工具的交互：

```bash
# 确保微信开发者工具已启动且端口已开启
# 设置环境变量
set WEAPP_CLI_PATH=D:\微信web开发者工具\cli.bat

# 启动服务器并测试工具
npm start
```

### 5.2 测试检查清单

每次修改后必须验证：

- [ ] `npm run build` 编译通过
- [ ] 服务器能正常启动
- [ ] 工具列表正确加载
- [ ] 修改的工具能通过基本测试
- [ ] 未修改的工具保持原有行为

---

## 六、代码提交规范

### 6.1 提交前检查

完成代码修改和测试后，执行以下操作：

1. **更新交接本**
   - 在 `PROJECT_HANDOVER.md` 的「第二部分：开发日志」中添加任务完成记录
   - 更新「第一部分：重要信息」中的当前状态（如版本号变更）
   - 如有新发现的遗留问题，更新遗留问题表格

2. **编译检查**
   ```bash
   npm run build
   ```

3. **代码风格检查**（如配置了 lint）
   ```bash
   npm run lint
   npm run format
   ```

### 6.2 Git 提交

**提交信息格式**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
| 类型 | 说明 |
|------|------|
| `feat` | 新工具/功能 |
| `fix` | Bug修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

**Scope 范围**:
| 范围 | 说明 |
|------|------|
| `tools` | 工具相关 |
| `cli` | CLI 客户端 |
| `server` | MCP 服务器 |
| `types` | 类型定义 |
| `utils` | 工具函数 |
| `docs` | 文档 |

**示例**:

```bash
git add .
git commit -m "feat(tools): 添加 weapp_status 状态检测工具

- 添加 weapp_status 工具检测 IDE 运行状态
- 添加 weapp_kill_all 工具强制关闭所有实例
- 在 status.ts 中实现端口检测和进程查找"
```

---

## 七、问题处理规范

### 7.1 MCP 协议问题

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 客户端无法连接 | 服务器未启动 | 检查 `npm start` 是否正常 |
| 工具调用超时 | CLI 执行时间过长 | 调整 timeout 参数 |
| JSON 解析错误 | 输出格式不正确 | 确保返回有效 JSON |

### 7.2 CLI 相关问题

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 找不到 CLI | 路径未配置 | 设置 `WEAPP_CLI_PATH` 环境变量 |
| CLI 命令失败 | IDE 未启动 | 先调用 `weapp_open` 启动 IDE |
| 端口冲突 | 多个 IDE 实例 | 使用 `weapp_kill_all` 关闭 |

### 7.3 编译错误处理

| 错误类型 | 解决方案 |
|----------|----------|
| TypeScript 类型错误 | 修复类型定义，使用 `unknown` 替代 `any` |
| 模块导入错误 | 检查路径，确保使用 `.js` 后缀 |
| ES Module 错误 | 确认 `tsconfig.json` 配置正确 |

---

## 八、快速参考

### 8.1 项目命令速查

```bash
# 开发
npm run dev          # 开发模式（自动编译）
npm run build        # 编译
npm start            # 启动服务器

# 代码质量
npm run lint         # 代码检查
npm run format       # 代码格式化

# 测试
npm test             # 运行测试（待补充）
```

### 8.2 文件路径速查

| 文件 | 路径 |
|------|------|
| 项目交接本 | `docs/meta/PROJECT_HANDOVER.md` |
| 工具注册中心 | `src/tools/index.ts` |
| CLI 客户端 | `src/cli-client.ts` |
| 服务器核心 | `src/server.ts` |
| 类型定义 | `src/types.ts` |
| 配置文件 | `src/config.ts` |

### 8.3 工具分类速查

| 分类 | 文件 | 工具数量 |
|------|------|----------|
| 登录认证 | `auth.ts` | 2 |
| 预览上传 | `preview.ts` | 3 |
| 项目管理 | `project.ts` | 5 |
| 构建 | `build.ts` | 2 |
| 自动化 | `automation.ts` | 2 |
| 云开发 | `cloud.ts` | 6 |
| 状态检测 | `status.ts` | 2 |

### 8.4 环境变量速查

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `WEAPP_CLI_PATH` | CLI 工具路径 | 自动检测 |
| `WEAPP_PORT` | HTTP 服务端口 | 9420 |
| `WEAPP_LANG` | 语言 (en/zh) | zh |
| `WEAPP_DEBUG` | 调试模式 | false |

---

## 九、附录

### 9.1 工作检查清单

每次开始工作前：
- [ ] 阅读 README.md 了解项目概况
- [ ] 查看交接本，确认上次任务已完成
- [ ] 检查 Git 状态，无未提交修改
- [ ] 检查编译状态，无编译错误
- [ ] 在交接本登记任务计划

每次代码修改后：
- [ ] 执行 `npm run build` 编译检查
- [ ] 本地启动服务器验证
- [ ] 更新交接本标注完成
- [ ] Git 提交并推送

---

**本文档由 AI Agent 维护，每次工作流程变更需同步更新。**
