/**
 * 自动化测试工具模块
 * 提供开启自动化功能和自动化测试回放功能
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { isValidProjectPath, formatError } from '../utils/helpers.js';

/**
 * 执行开启自动化工具
 */
async function executeAuto(args: {
  project: string;
  autoPort?: number;
  autoAccount?: string;
  trustProject?: boolean;
  ticket?: string;
}): Promise<ToolResult> {
  // 验证项目路径
  if (!isValidProjectPath(args.project)) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        },
      ],
      isError: true,
    };
  }

  // 验证 autoPort 参数
  if (args.autoPort !== undefined) {
    if (!Number.isInteger(args.autoPort) || args.autoPort <= 0 || args.autoPort > 65535) {
      return {
        content: [
          {
            type: 'text',
            text: `错误: autoPort 必须是 1-65535 之间的整数`,
          },
        ],
        isError: true,
      };
    }
  }

  try {
    const result = await cliClient.auto(args.project, {
      autoPort: args.autoPort,
      autoAccount: args.autoAccount,
      trustProject: args.trustProject,
      ticket: args.ticket,
    });

    if (result.success) {
      const outputLines: string[] = ['✅ 自动化功能开启成功！'];

      outputLines.push('', '📋 配置信息:');
      outputLines.push(`   项目路径: ${args.project}`);

      if (args.autoPort) {
        outputLines.push(`   自动化端口: ${args.autoPort}`);
      }

      if (args.autoAccount) {
        outputLines.push(`   自动化账号: ${args.autoAccount}`);
      }

      if (args.trustProject) {
        outputLines.push(`   信任项目: 是`);
      }

      if (result.stdout) {
        outputLines.push('', '📝 输出信息:', result.stdout);
      }

      outputLines.push(
        '',
        '提示: 自动化功能已开启，可以通过自动化脚本控制微信开发者工具。'
      );

      return {
        content: [
          {
            type: 'text',
            text: outputLines.join('\n'),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 开启自动化功能失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
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
          text: `❌ 执行开启自动化命令时出错: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行自动化测试回放工具
 */
async function executeAutoReplay(args: {
  project: string;
  replayAll?: boolean;
  replayConfigPath?: string;
  trustProject?: boolean;
  ticket?: string;
}): Promise<ToolResult> {
  // 验证项目路径
  if (!isValidProjectPath(args.project)) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await cliClient.autoReplay(args.project, {
      replayAll: args.replayAll,
      replayConfigPath: args.replayConfigPath,
      trustProject: args.trustProject,
      ticket: args.ticket,
    });

    if (result.success) {
      const outputLines: string[] = ['✅ 自动化测试回放执行成功！'];

      outputLines.push('', '📋 配置信息:');
      outputLines.push(`   项目路径: ${args.project}`);

      if (args.replayAll) {
        outputLines.push(`   回放模式: 全部回放`);
      }

      if (args.replayConfigPath) {
        outputLines.push(`   回放配置文件: ${args.replayConfigPath}`);
      }

      if (args.trustProject) {
        outputLines.push(`   信任项目: 是`);
      }

      if (result.stdout) {
        outputLines.push('', '📝 输出信息:', result.stdout);
      }

      outputLines.push(
        '',
        '提示: 自动化测试回放已完成。'
      );

      return {
        content: [
          {
            type: 'text',
            text: outputLines.join('\n'),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 自动化测试回放失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
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
          text: `❌ 执行自动化测试回放命令时出错: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 自动化工具定义数组
 */
export const automationTools: ToolDefinition[] = [
  {
    name: 'weapp_auto',
    description: '开启微信开发者工具的自动化功能，允许通过自动化脚本控制开发者工具',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目路径，必须是包含 project.config.json 的目录',
        },
        autoPort: {
          type: 'number',
          description: '自动化服务监听的端口号，范围为 1-65535',
        },
        autoAccount: {
          type: 'string',
          description: '自动化账号，用于标识自动化会话',
        },
        trustProject: {
          type: 'boolean',
          description: '是否信任项目，启用后可跳过某些安全提示',
          default: false,
        },
        ticket: {
          type: 'string',
          description: '登录票据，用于验证身份',
        },
      },
      required: ['project'],
    },
    handler: executeAuto,
  },
  {
    name: 'weapp_auto_replay',
    description: '执行自动化测试回放，根据录制好的测试用例自动运行测试',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目路径，必须是包含 project.config.json 的目录',
        },
        replayAll: {
          type: 'boolean',
          description: '是否回放所有测试用例，为 true 时回放全部，为 false 时根据配置文件回放',
          default: false,
        },
        replayConfigPath: {
          type: 'string',
          description: '回放配置文件的路径，指定要回放的测试用例配置',
        },
        trustProject: {
          type: 'boolean',
          description: '是否信任项目，启用后可跳过某些安全提示',
          default: false,
        },
        ticket: {
          type: 'string',
          description: '登录票据，用于验证身份',
        },
      },
      required: ['project'],
    },
    handler: executeAutoReplay,
  },
];

/**
 * 工具执行映射表（向后兼容）
 * @deprecated 直接使用工具的 handler 方法
 */
export const automationToolExecutors = {
  weapp_auto: executeAuto,
  weapp_auto_replay: executeAutoReplay,
};
