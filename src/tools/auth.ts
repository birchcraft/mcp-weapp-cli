/**
 * 登录认证相关工具
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, QRFormat, QRSize } from '../types.js';
import { createTool, createSimpleToolHandler } from '../utils/tool-wrapper.js';
import { json } from '../utils/result-formatter.js';

/**
 * 登录工具
 */
const weappLogin = createTool<{
  qrFormat?: QRFormat;
  qrSize?: QRSize;
  qrOutput?: string;
  resultOutput?: string;
}>('weapp_login', '登录微信开发者工具。通过扫描二维码完成微信登录，支持多种二维码输出格式。')
  .stringParam('qrFormat', '二维码格式：terminal-终端显示（默认），image-图片文件，base64-base64编码', {
    enum: ['terminal', 'image', 'base64'],
    default: 'terminal',
  })
  .stringParam('qrSize', '二维码大小（仅当 qrFormat 为 terminal 时有效）：small-小尺寸，default-默认尺寸', {
    enum: ['small', 'default'],
  })
  .stringParam('qrOutput', '二维码输出路径（当 qrFormat 为 image 时有效）')
  .stringParam('resultOutput', '登录结果输出路径，用于保存登录后的用户信息')
  .setHandler(async (args) => {
    const result = await cliClient.login(
      args.qrFormat || 'terminal',
      args.qrSize,
      args.qrOutput,
      args.resultOutput
    );

    if (result.success) {
      return json({
        success: true,
        code: result.code,
        message: '登录成功',
        output: result.stdout || undefined,
      });
    } else {
      return json(
        {
          success: false,
          code: result.code,
          message: '登录失败',
          error: result.stderr || result.stdout || '未知错误',
        },
        true
      );
    }
  })
  .build();

/**
 * 检查登录状态工具
 */
const weappCheckLogin = createTool('weapp_check_login', '检查微信开发者工具的登录状态。返回当前是否已登录以及登录的用户信息。')
  .setHandler(async () => {
    const result = await cliClient.checkLogin();
    const isLoggedIn = result.success && result.code === 0;

    // 尝试解析输出中的用户信息
    let userInfo = null;
    if (result.stdout) {
      try {
        const parsed = JSON.parse(result.stdout);
        userInfo = parsed;
      } catch {
        userInfo = { raw: result.stdout };
      }
    }

    return json({
      isLoggedIn,
      code: result.code,
      message: isLoggedIn ? '已登录' : '未登录',
      userInfo: isLoggedIn ? userInfo : undefined,
      error: !isLoggedIn && result.stderr ? result.stderr : undefined,
    });
  })
  .build();

/**
 * 认证工具数组
 */
export const authTools: ToolDefinition[] = [weappLogin, weappCheckLogin];
