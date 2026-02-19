/**
 * 项目管理相关工具
 * 提供打开、关闭、退出等基础操作
 */

import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { formatError } from '../utils/helpers.js';

/**
 * 执行打开工具/项目
 */
async function executeOpen(args: { projectPath?: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.open(args.projectPath);

    if (result.success) {
      const message = args.projectPath
        ? `成功打开项目: ${args.projectPath}`
        : '成功打开微信开发者工具';
      return {
        content: [
          {
            type: 'text',
            text: `${message}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `打开失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
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
 * 执行以其他模式打开
 */
async function executeOpenOther(args: { projectPath: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.openOther(args.projectPath);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `成功以其他模式打开项目: ${args.projectPath}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `以其他模式打开失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
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
 * 执行关闭项目
 */
async function executeClose(args: { projectPath?: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.close(args.projectPath);

    if (result.success) {
      const message = args.projectPath
        ? `成功关闭项目: ${args.projectPath}`
        : '成功关闭当前项目';
      return {
        content: [
          {
            type: 'text',
            text: `${message}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `关闭失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
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
 * 执行退出工具
 */
async function executeQuit(): Promise<ToolResult> {
  try {
    const result = await cliClient.quit();

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `成功退出微信开发者工具\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `退出失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
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
 * 执行重置文件监听
 */
async function executeResetFileutils(args: { projectPath?: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.resetFileutils(args.projectPath);

    if (result.success) {
      const message = args.projectPath
        ? `成功重置项目文件监听: ${args.projectPath}`
        : '成功重置文件监听';
      return {
        content: [
          {
            type: 'text',
            text: `${message}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `重置失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
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
 * 项目管理工具定义
 */
export const projectTools: ToolDefinition[] = [
  {
    name: 'weapp_open',
    description: '打开微信开发者工具或指定项目。如果不指定项目路径，则只打开工具；如果指定项目路径，则打开对应的小程序项目。',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径（可选）。小程序项目根目录，包含 project.config.json 的目录',
        },
      },
      required: [],
    },
    handler: executeOpen,
  },
  {
    name: 'weapp_open_other',
    description: '以其他模式打开微信小程序项目。会以独立窗口或不同模式打开项目，用于特殊场景下的开发调试。',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
      },
      required: ['projectPath'],
    },
    handler: executeOpenOther,
  },
  {
    name: 'weapp_close',
    description: '关闭微信小程序项目。可以关闭指定项目，或不指定项目路径时关闭当前活动项目。',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径（可选）。指定要关闭的小程序项目路径',
        },
      },
      required: [],
    },
    handler: executeClose,
  },
  {
    name: 'weapp_quit',
    description: '完全退出微信开发者工具。此操作会关闭整个开发者工具进程，所有打开的项目都会被关闭。',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: executeQuit,
  },
  {
    name: 'weapp_reset_fileutils',
    description: '重置微信开发者工具的文件监听。当文件监听出现异常或需要刷新文件状态时，可以使用此工具重置文件监听模块。',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: '项目路径（可选）。指定要重置文件监听的项目路径',
        },
      },
      required: [],
    },
    handler: executeResetFileutils,
  },
];

/**
 * 工具执行映射表（向后兼容）
 * @deprecated 直接使用工具的 handler 方法
 */
export const projectToolExecutors = {
  weapp_open: executeOpen,
  weapp_open_other: executeOpenOther,
  weapp_close: executeClose,
  weapp_quit: executeQuit,
  weapp_reset_fileutils: executeResetFileutils,
};
