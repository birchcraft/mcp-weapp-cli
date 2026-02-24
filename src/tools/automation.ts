/**
 * 自动化测试工具模块
 */
import { createConnection } from 'net';
import { cliClient } from '../cli-client.js';
import { ToolDefinition } from '../types.js';
import { isValidProjectPath } from '../utils/helpers.js';
import { createTool } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * 检查端口是否被监听
 */
function checkPortListening(port: number, host: string = 'localhost', timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection(port, host);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(timeout);
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * 开启自动化工具
 */
const weappAuto = createTool<{
  project: string;
  autoPort?: number;
  autoAccount?: string;
  trustProject?: boolean;
  ticket?: string;
}>('weapp_auto', '开启微信开发者工具的自动化功能，允许通过自动化脚本控制开发者工具')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .numberParam('autoPort', '自动化服务监听的端口号，范围为 1-65535')
  .stringParam('autoAccount', '自动化账号，用于标识自动化会话')
  .booleanParam('trustProject', '是否信任项目，启用后可跳过某些安全提示')
  .stringParam('ticket', '登录票据，用于验证身份')
  .setHandler(async (args) => {
    // 参数验证
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    if (args.autoPort !== undefined) {
      if (!Number.isInteger(args.autoPort) || args.autoPort <= 0 || args.autoPort > 65535) {
        return text('错误: autoPort 必须是 1-65535 之间的整数', true);
      }
    }

    const autoPort = args.autoPort || 9420;
    const wsEndpoint = `ws://localhost:${autoPort}`;
    const outputLines: string[] = ['🤖 开启自动化功能'];

    try {
      // 前置检查：检测端口是否已被占用
      outputLines.push('\n📋 前置检查:');
      const portOccupied = await checkPortListening(autoPort);
      if (portOccupied) {
        outputLines.push(`   ⚠️ 端口 ${autoPort} 已被占用，可能存在其他自动化实例`);
        outputLines.push(`   建议: 尝试使用其他端口，或执行 weapp_kill_all 关闭所有实例后重试`);
      } else {
        outputLines.push(`   ✅ 端口 ${autoPort} 可用`);
      }

      // 执行自动化命令
      outputLines.push('\n🚀 执行自动化命令...');
      const result = await cliClient.auto(args.project, {
        autoPort: args.autoPort,
        autoAccount: args.autoAccount,
        trustProject: args.trustProject,
        ticket: args.ticket,
      });

      // 等待一小段时间让服务启动
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 检查端口是否被监听
      const isListening = await checkPortListening(autoPort);

      // 解析 CLI 输出中的 HTTP server 端口
      const combinedOutput = `${result.stdout || ''} ${result.stderr || ''}`;
      const httpPortMatch = combinedOutput.match(/listening on http:\/\/[^:]+:(\d+)/i);
      const httpPort = httpPortMatch ? parseInt(httpPortMatch[1], 10) : null;

      if (result.success) {
        outputLines.push('✅ CLI 命令执行成功！');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}`);
      }

      // 显示配置信息
      outputLines.push(
        '\n📋 配置信息:',
        `   项目路径: ${args.project}`,
        `   WebSocket 端点: ${wsEndpoint}`
      );

      if (args.autoPort) {
        outputLines.push(`   自动化端口: ${args.autoPort}`);
      } else {
        outputLines.push(`   自动化端口: ${autoPort} (默认)`);
      }

      if (httpPort) {
        outputLines.push(`   IDE HTTP Server: http://127.0.0.1:${httpPort} (CLI 通信用)`);
      }

      if (args.autoAccount) {
        outputLines.push(`   自动化账号: ${args.autoAccount}`);
      }

      if (args.trustProject) {
        outputLines.push(`   信任项目: 是`);
      }

      outputLines.push(`   自动化端口监听: ${isListening ? '✅ 正常' : '⚠️ 未检测到'}`);

      if (result.stdout) {
        outputLines.push('\n📝 CLI 输出:', result.stdout);
      }

      if (result.stderr) {
        outputLines.push('\n⚠️ CLI 错误输出:', result.stderr);
      }

      // 提供使用建议
      outputLines.push('\n💡 使用提示:');

      if (isListening) {
        outputLines.push(
          `   ✅ 自动化服务已就绪，请使用以下配置连接:`,
          ``,
          `   WebSocket 端点: ${wsEndpoint}`,
          ``,
          `   在 mp_ensureConnection 中使用:`,
          `   {`,
          `     "wsEndpoint": "${wsEndpoint}",`,
          `     "projectPath": "${args.project}"`,
          `   }`
        );
      } else {
        outputLines.push(
          `   ❌ 自动化端口未监听，可能原因:`,
          `      1. IDE 中未开启"服务端口"（设置 -> 安全设置 -> 服务端口）`,
          `      2. 指定的端口被其他程序占用`,
          `      3. IDE 实例冲突（存在多个实例）`,
          ``,
          `   建议解决方案:`,
          `      1. 执行 weapp_status 检查当前状态`,
          `      2. 执行 weapp_kill_all 关闭所有实例后重试`,
          `      3. 更换其他端口号（如 9421、9422）`,
          `      4. 在 IDE 设置中确认"服务端口"已开启`
        );
      }

      return text(outputLines.join('\n'));
    } catch (error) {
      return text(`❌ 执行开启自动化命令时出错: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 自动化测试回放工具
 */
const weappAutoReplay = createTool<{
  project: string;
  replayAll?: boolean;
  replayConfigPath?: string;
  trustProject?: boolean;
  ticket?: string;
}>('weapp_auto_replay', '执行自动化测试回放，根据录制好的测试用例自动运行测试')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .booleanParam('replayAll', '是否回放所有测试用例，为 true 时回放全部，为 false 时根据配置文件回放')
  .stringParam('replayConfigPath', '回放配置文件的路径，指定要回放的测试用例配置')
  .booleanParam('trustProject', '是否信任项目，启用后可跳过某些安全提示')
  .stringParam('ticket', '登录票据，用于验证身份')
  .wrapHandler({
    operation: '自动化测试回放',
    executor: async (args) => {
      return cliClient.autoReplay(args.project, {
        replayAll: args.replayAll,
        replayConfigPath: args.replayConfigPath,
        trustProject: args.trustProject,
        ticket: args.ticket,
      });
    },
    validator: (args) => {
      if (!isValidProjectPath(args.project)) {
        return {
          valid: false,
          error: text(
            `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
            true
          ),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 自动化工具数组
 */
export const automationTools: ToolDefinition[] = [weappAuto, weappAutoReplay];
