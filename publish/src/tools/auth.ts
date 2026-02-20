/**
 * 登录认证相关工具
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult, QRFormat, QRSize } from '../types.js';
import { formatError } from '../utils/helpers.js';

/**
 * 格式化工具结果为 JSON
 */
function formatResult(data: unknown, isError = false): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

/**
 * 登录工具
 */
const weappLogin: ToolDefinition = {
  name: 'weapp_login',
  description: '登录微信开发者工具。通过扫描二维码完成微信登录，支持多种二维码输出格式。',
  inputSchema: {
    type: 'object',
    properties: {
      qrFormat: {
        type: 'string',
        enum: ['terminal', 'image', 'base64'],
        description: '二维码格式：terminal-终端显示（默认），image-图片文件，base64-base64编码',
        default: 'terminal',
      },
      qrSize: {
        type: 'string',
        enum: ['small', 'default'],
        description: '二维码大小（仅当 qrFormat 为 terminal 时有效）：small-小尺寸，default-默认尺寸',
      },
      qrOutput: {
        type: 'string',
        description: '二维码输出路径（当 qrFormat 为 image 时有效）',
      },
      resultOutput: {
        type: 'string',
        description: '登录结果输出路径，用于保存登录后的用户信息',
      },
    },
  },
  handler: async (args: {
    qrFormat?: QRFormat;
    qrSize?: QRSize;
    qrOutput?: string;
    resultOutput?: string;
  }): Promise<ToolResult> => {
    try {
      const result = await cliClient.login(
        args.qrFormat || 'terminal',
        args.qrSize,
        args.qrOutput,
        args.resultOutput
      );

      if (result.success) {
        return formatResult({
          success: true,
          code: result.code,
          message: '登录成功',
          output: result.stdout || undefined,
        });
      } else {
        return formatResult(
          {
            success: false,
            code: result.code,
            message: '登录失败',
            error: result.stderr || result.stdout || '未知错误',
          },
          true
        );
      }
    } catch (error) {
      return formatResult(
        {
          success: false,
          message: '登录过程中发生错误',
          error: formatError(error),
        },
        true
      );
    }
  },
};

/**
 * 检查登录状态工具
 */
const weappCheckLogin: ToolDefinition = {
  name: 'weapp_check_login',
  description: '检查微信开发者工具的登录状态。返回当前是否已登录以及登录的用户信息。',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (): Promise<ToolResult> => {
    try {
      const result = await cliClient.checkLogin();

      // 解析登录状态
      const isLoggedIn = result.success && result.code === 0;

      // 尝试解析输出中的用户信息
      let userInfo = null;
      if (result.stdout) {
        try {
          // 尝试解析 JSON 格式的输出
          const parsed = JSON.parse(result.stdout);
          userInfo = parsed;
        } catch {
          // 如果不是 JSON，使用原始输出
          userInfo = { raw: result.stdout };
        }
      }

      return formatResult({
        isLoggedIn,
        code: result.code,
        message: isLoggedIn ? '已登录' : '未登录',
        userInfo: isLoggedIn ? userInfo : undefined,
        error: !isLoggedIn && result.stderr ? result.stderr : undefined,
      });
    } catch (error) {
      return formatResult(
        {
          isLoggedIn: false,
          message: '检查登录状态时发生错误',
          error: formatError(error),
        },
        true
      );
    }
  },
};

/**
 * 认证工具数组
 */
export const authTools: ToolDefinition[] = [weappLogin, weappCheckLogin];
