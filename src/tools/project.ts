/**
 * 项目管理相关工具
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition } from '../types.js';
import { createTool, createSimpleToolHandler, createToolHandler } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * 打开工具
 */
const weappOpen = createTool<{ projectPath?: string }>(
  'weapp_open',
  '打开微信开发者工具或指定项目。如果不指定项目路径，则只打开工具；如果指定项目路径，则打开对应的小程序项目。'
)
  .stringParam('projectPath', '项目路径（可选）。小程序项目根目录，包含 project.config.json 的目录')
  .wrapHandler({
    operation: '打开工具',
    executor: async (args) => {
      return cliClient.open(args.projectPath);
    },
  })
  .build();

/**
 * 以其他模式打开
 */
const weappOpenOther = createTool<{ projectPath: string }>(
  'weapp_open_other',
  '以其他模式打开微信小程序项目。会以独立窗口或不同模式打开项目，用于特殊场景下的开发调试。'
)
  .stringParam('projectPath', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .wrapHandler({
    operation: '以其他模式打开',
    executor: async (args) => {
      return cliClient.openOther(args.projectPath);
    },
    validator: (args) => {
      if (!args.projectPath) {
        return {
          valid: false,
          error: text('错误: 必须提供项目路径', true),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 关闭项目
 */
const weappClose = createTool<{ projectPath?: string }>(
  'weapp_close',
  '关闭微信小程序项目。可以关闭指定项目，或不指定项目路径时关闭当前活动项目。'
)
  .stringParam('projectPath', '项目路径（可选）。指定要关闭的小程序项目路径')
  .wrapHandler({
    operation: '关闭项目',
    executor: async (args) => {
      return cliClient.close(args.projectPath);
    },
  })
  .build();

/**
 * 退出工具
 */
const weappQuit = createTool('weapp_quit', '完全退出微信开发者工具。此操作会关闭整个开发者工具进程，所有打开的项目都会被关闭。')
  .setHandler(createSimpleToolHandler('退出工具', () => cliClient.quit()))
  .build();

/**
 * 重置文件监听
 */
const weappResetFileutils = createTool<{ projectPath?: string }>(
  'weapp_reset_fileutils',
  '重置微信开发者工具的文件监听。当文件监听出现异常或需要刷新文件状态时，可以使用此工具重置文件监听模块。'
)
  .stringParam('projectPath', '项目路径（可选）。指定要重置文件监听的项目路径')
  .wrapHandler({
    operation: '重置文件监听',
    executor: async (args) => {
      return cliClient.resetFileutils(args.projectPath);
    },
  })
  .build();

/**
 * 项目管理工具数组
 */
export const projectTools: ToolDefinition[] = [
  weappOpen,
  weappOpenOther,
  weappClose,
  weappQuit,
  weappResetFileutils,
];
