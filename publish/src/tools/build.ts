/**
 * 构建相关工具
 * 提供 npm 构建和缓存清除功能
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult, CompileType, CacheType } from '../types.js';
import { formatError } from '../utils/helpers.js';

/**
 * 执行构建 npm 工具
 */
async function executeBuildNpm(args: {
  project?: string;
  projectPath?: string;
  compileType?: CompileType;
}): Promise<ToolResult> {
  try {
    // 兼容 project 和 projectPath 两个参数名
    const projectPath = args.project || args.projectPath;
    
    if (!projectPath || typeof projectPath !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: '错误: project 或 projectPath 是必需参数，必须提供小程序项目的绝对路径',
          },
        ],
        isError: true,
      };
    }

    // 验证 compileType
    if (args.compileType && !['miniprogram', 'plugin'].includes(args.compileType)) {
      return {
        content: [
          {
            type: 'text',
            text: `错误: compileType 必须是 'miniprogram' 或 'plugin'`,
          },
        ],
        isError: true,
      };
    }

    const result = await cliClient.buildNpm(
      projectPath,
      args.compileType
    );

    if (result.success) {
      const typeInfo = args.compileType ? ` (${args.compileType})` : '';
      // 合并 stdout 和 stderr
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `✓ npm 构建成功${typeInfo}\n\n项目路径: ${projectPath}${output ? `\n\n输出信息:\n${output}` : ''}`,
          },
        ],
      };
    } else {
      // 合并 stdout 和 stderr
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `✗ npm 构建失败 (退出码: ${result.code})\n\n${output || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行清除缓存工具
 */
async function executeClearCache(args: { clean?: CacheType }): Promise<ToolResult> {
  try {
    const clean = args.clean || 'all';

    // 验证 clean 参数
    const validCacheTypes: CacheType[] = ['storage', 'file', 'compile', 'auth', 'network', 'session', 'all'];
    if (!validCacheTypes.includes(clean)) {
      return {
        content: [
          {
            type: 'text',
            text: `错误: clean 必须是以下值之一: ${validCacheTypes.join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    const result = await cliClient.clearCache(clean);

    if (result.success) {
      const cacheTypeMap: Record<CacheType, string> = {
        storage: '数据缓存',
        file: '文件缓存',
        compile: '编译缓存',
        auth: '登录授权缓存',
        network: '网络缓存',
        session: '会话缓存',
        all: '全部缓存',
      };

      return {
        content: [
          {
            type: 'text',
            text: `✓ 缓存清除成功\n\n清除类型: ${cacheTypeMap[clean]} (${clean})${result.stdout ? `\n\n输出信息:\n${result.stdout}` : ''}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `✗ 缓存清除失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 构建工具定义数组
 */
export const buildTools: ToolDefinition[] = [
  {
    name: 'weapp_build_npm',
    description: '构建 npm 包，将 node_modules 中的依赖构建为小程序可用的模块',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目目录的绝对路径（与 projectPath 二选一）',
        },
        projectPath: {
          type: 'string',
          description: '小程序项目目录的绝对路径（与 project 二选一，推荐使用 project）',
        },
        compileType: {
          type: 'string',
          enum: ['miniprogram', 'plugin'],
          description: '编译类型：miniprogram（普通小程序）或 plugin（插件）。默认为 miniprogram',
        },
      },
      required: [],
    },
    handler: executeBuildNpm,
  },
  {
    name: 'weapp_clear_cache',
    description: '清除微信开发者工具的缓存数据',
    inputSchema: {
      type: 'object',
      properties: {
        clean: {
          type: 'string',
          enum: ['storage', 'file', 'compile', 'auth', 'network', 'session', 'all'],
          description: '要清除的缓存类型：storage（数据缓存）、file（文件缓存）、compile（编译缓存）、auth（登录授权缓存）、network（网络缓存）、session（会话缓存）、all（全部缓存）。默认为 all',
          default: 'all',
        },
      },
    },
    handler: executeClearCache,
  },
];

/**
 * 执行构建工具（向后兼容）
 * @param name 工具名称
 * @param args 工具参数
 * @returns 工具执行结果
 * @deprecated 直接使用工具的 handler 方法
 */
export async function executeBuildTool(
  name: string,
  args: Record<string, any>
): Promise<ToolResult> {
  switch (name) {
    case 'weapp_build_npm':
      return executeBuildNpm(args as { projectPath: string; compileType?: CompileType });
    case 'weapp_clear_cache':
      return executeClearCache(args as { clean?: CacheType })
    default:
      return {
        content: [
          {
            type: 'text',
            text: `未知的构建工具: ${name}`,
          },
        ],
        isError: true,
      };
  }
}
