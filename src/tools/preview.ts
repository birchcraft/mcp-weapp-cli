/**
 * 预览和上传工具模块
 * 包含预览二维码生成、自动预览和代码上传功能
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { isValidProjectPath, formatError } from '../utils/helpers.js';

/**
 * 执行预览工具
 */
async function executePreview(args: {
  project: string;
  qrFormat?: 'terminal' | 'image' | 'base64';
  qrOutput?: string;
  infoOutput?: string;
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
    const result = await cliClient.preview(
      args.project,
      args.qrFormat || 'terminal',
      args.qrOutput,
      args.infoOutput
    );

    if (result.success) {
      const outputLines: string[] = ['✅ 预览二维码生成成功！'];

      if (result.stdout) {
        outputLines.push('', '📝 输出信息:', result.stdout);
      }

      if (args.qrOutput) {
        outputLines.push('', `📱 二维码已保存至: ${args.qrOutput}`);
      }

      if (args.infoOutput) {
        outputLines.push(`📄 预览信息已保存至: ${args.infoOutput}`);
      }

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
            text: `❌ 预览失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
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
          text: `❌ 执行预览命令时出错: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行自动预览工具
 */
async function executeAutoPreview(args: {
  project: string;
  infoOutput?: string;
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
    const result = await cliClient.autoPreview(args.project, args.infoOutput);

    if (result.success) {
      const outputLines: string[] = ['✅ 自动预览启动成功！'];

      if (result.stdout) {
        outputLines.push('', '📝 输出信息:', result.stdout);
      }

      if (args.infoOutput) {
        outputLines.push('', `📄 预览信息已保存至: ${args.infoOutput}`);
      }

      outputLines.push(
        '',
        '提示: 请使用微信扫描二维码预览小程序。',
        '如需停止自动预览，请关闭微信开发者工具或运行 quit 命令。'
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
            text: `❌ 自动预览启动失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
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
          text: `❌ 执行自动预览命令时出错: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行上传工具
 */
async function executeUpload(args: {
  project: string;
  version: string;
  desc: string;
  infoOutput?: string;
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

  // 验证版本号格式
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(args.version)) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: 无效的版本号格式: ${args.version}\n版本号必须使用 x.y.z 格式（如 1.0.0）。`,
        },
      ],
      isError: true,
    };
  }

  // 验证版本描述
  if (!args.desc || args.desc.trim().length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: '错误: 版本描述不能为空。',
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await cliClient.upload(
      args.project,
      args.version,
      args.desc,
      args.infoOutput
    );

    if (result.success) {
      const outputLines: string[] = [
        '✅ 代码上传成功！',
        '',
        '📦 上传详情:',
        `   版本号: ${args.version}`,
        `   版本描述: ${args.desc}`,
      ];

      if (result.stdout) {
        outputLines.push('', '📝 输出信息:', result.stdout);
      }

      if (args.infoOutput) {
        outputLines.push('', `📄 上传信息已保存至: ${args.infoOutput}`);
      }

      outputLines.push(
        '',
        '提示: 代码已上传到微信公众平台。',
        '您可以在微信公众平台后台将此版本设置为体验版或提交审核。'
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
            text: `❌ 代码上传失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
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
          text: `❌ 执行上传命令时出错: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 工具定义数组
 */
export const previewTools: ToolDefinition[] = [
  {
    name: 'weapp_preview',
    description: '生成微信小程序预览二维码，用于在真机上预览小程序效果',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目路径，必须是包含 project.config.json 的目录',
        },
        qrFormat: {
          type: 'string',
          enum: ['terminal', 'image', 'base64'],
          description: '二维码格式：terminal(终端输出)、image(图片文件)、base64(Base64编码)',
          default: 'terminal',
        },
        qrOutput: {
          type: 'string',
          description: '二维码图片输出路径（当 qrFormat 为 image 时使用）',
        },
        infoOutput: {
          type: 'string',
          description: '预览信息输出文件路径（JSON格式）',
        },
      },
      required: ['project'],
    },
    handler: executePreview,
  },
  {
    name: 'weapp_auto_preview',
    description: '自动预览小程序，将自动打开微信开发者工具并生成预览二维码',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目路径，必须是包含 project.config.json 的目录',
        },
        infoOutput: {
          type: 'string',
          description: '预览信息输出文件路径（JSON格式）',
        },
      },
      required: ['project'],
    },
    handler: executeAutoPreview,
  },
  {
    name: 'weapp_upload',
    description: '上传微信小程序代码到微信公众平台，用于提交审核或发布体验版',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '小程序项目路径，必须是包含 project.config.json 的目录',
        },
        version: {
          type: 'string',
          description: '版本号，格式为 x.y.z（如 1.0.0）',
        },
        desc: {
          type: 'string',
          description: '版本描述信息，将在微信公众平台显示',
        },
        infoOutput: {
          type: 'string',
          description: '上传信息输出文件路径（JSON格式）',
        },
      },
      required: ['project', 'version', 'desc'],
    },
    handler: executeUpload,
  },
];

/**
 * 工具执行映射表（向后兼容）
 * @deprecated 直接使用工具的 handler 方法
 */
export const previewToolExecutors = {
  weapp_preview: executePreview,
  weapp_auto_preview: executeAutoPreview,
  weapp_upload: executeUpload,
};
