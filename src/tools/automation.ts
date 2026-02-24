/**
 * 自动化测试工具模块
 */
import { createConnection } from 'net';
import { cliClient } from '../cli-client.js';
import { httpClient } from '../http-client.js';
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
 * 等待端口监听（带轮询）
 */
async function waitForPortListening(
  port: number,
  maxWaitMs: number = 10000,
  checkIntervalMs: number = 500
): Promise<{ listening: boolean; waitedMs: number }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const isListening = await checkPortListening(port);
    if (isListening) {
      return { listening: true, waitedMs: Date.now() - startTime };
    }
    await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
  }

  return { listening: false, waitedMs: Date.now() - startTime };
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
}>('weapp_auto', '开启微信开发者工具的自动化功能，允许通过自动化脚本控制开发者工具。会检测自动化端口是否真正被监听，并返回实际监听状态。')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .numberParam('autoPort', '自动化服务监听的端口号，范围为 1-65535。注意：这是自动化端口，不是 HTTP 端口。')
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

    const specifiedAutoPort = args.autoPort || 9420;
    const wsEndpoint = `ws://localhost:${specifiedAutoPort}`;
    const outputLines: string[] = ['🤖 开启自动化功能'];

    try {
      // 前置检查：检测端口是否已被占用
      outputLines.push('\n📋 前置检查:');
      const portOccupied = await checkPortListening(specifiedAutoPort);
      if (portOccupied) {
        outputLines.push(`   ⚠️ 端口 ${specifiedAutoPort} 已被占用，可能存在其他自动化实例`);
        outputLines.push(`   建议: 尝试使用其他端口，或执行 weapp_kill_all 关闭所有实例后重试`);
      } else {
        outputLines.push(`   ✅ 端口 ${specifiedAutoPort} 可用`);
      }

      // 执行自动化命令
      outputLines.push('\n🚀 执行自动化命令...');
      const result = await cliClient.auto(args.project, {
        autoPort: args.autoPort,
        autoAccount: args.autoAccount,
        trustProject: args.trustProject,
        ticket: args.ticket,
      });

      // 等待自动化服务启动并检测端口
      outputLines.push('\n⏱️  等待自动化服务启动...');
      const { listening, waitedMs } = await waitForPortListening(specifiedAutoPort, 8000, 500);

      // 检测 HTTP 服务端口
      let httpPortInfo = '';
      const httpDetection = await httpClient.detectHttpPort();
      if (httpDetection.found && httpDetection.port) {
        httpPortInfo = `\n📋 HTTP 服务信息:\n   HTTP 端口: ${httpDetection.port}\n   HTTP 服务地址: http://127.0.0.1:${httpDetection.port}`;
      }

      // 解析 CLI 输出中的 HTTP server 端口
      const combinedOutput = `${result.stdout || ''} ${result.stderr || ''}`;
      const httpPortMatch = combinedOutput.match(/listening on http:\/\/[^:]+:(\d+)/i);
      const cliHttpPort = httpPortMatch ? parseInt(httpPortMatch[1], 10) : null;

      if (result.success) {
        outputLines.push('✅ CLI 命令执行成功！');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}`);
      }

      // 显示配置信息
      outputLines.push(
        '\n📋 自动化配置:',
        `   项目路径: ${args.project}`,
        `   指定的自动化端口: ${specifiedAutoPort}`
      );

      if (args.autoAccount) {
        outputLines.push(`   自动化账号: ${args.autoAccount}`);
      }

      if (args.trustProject) {
        outputLines.push(`   信任项目: 是`);
      }

      if (cliHttpPort) {
        outputLines.push(`   CLI HTTP 端口: ${cliHttpPort} (CLI 通信用)`);
      }

      outputLines.push(`\n⏱️  等待时间: ${waitedMs}ms`);

      // 关键的端口监听状态
      outputLines.push('\n📋 端口监听状态:');
      if (listening) {
        outputLines.push(`   ✅ 自动化端口 ${specifiedAutoPort} 正在监听 (符合预期)`);
        outputLines.push(`   WebSocket 端点: ${wsEndpoint}`);
      } else {
        outputLines.push(`   ❌ 自动化端口 ${specifiedAutoPort} 未检测到监听 (不符合预期！)`);
      }

      if (httpPortInfo) {
        outputLines.push(httpPortInfo);
      }

      if (result.stdout) {
        outputLines.push('\n📝 CLI 输出:', result.stdout);
      }

      if (result.stderr) {
        outputLines.push('\n⚠️ CLI 错误输出:', result.stderr);
      }

      // 提供使用建议
      outputLines.push('\n💡 使用提示:');

      if (listening) {
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
          `      4. 启动有延迟，建议稍后重试`,
          ``,
          `   建议解决方案:`,
          `      1. 执行 weapp_status 检查当前状态`,
          `      2. 执行 weapp_kill_all 关闭所有实例后重试`,
          `      3. 更换其他端口号（如 9421、9422）`,
          `      4. 在 IDE 设置中确认"服务端口"已开启`,
          `      5. 使用 weapp_http_detect_port 检查 HTTP 服务状态`
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
  .setHandler(async (args) => {
    // 参数验证
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['🎬 自动化测试回放'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await cliClient.autoReplay(args.project, {
        replayAll: args.replayAll,
        replayConfigPath: args.replayConfigPath,
        trustProject: args.trustProject,
        ticket: args.ticket,
      });

      if (result.success) {
        outputLines.push('\n✅ 回放完成！');
      } else {
        outputLines.push(`\n⚠️ CLI 命令返回非零退出码: ${result.code}`);
      }

      if (args.replayAll) {
        outputLines.push('   回放模式: 全部用例');
      }

      if (args.replayConfigPath) {
        outputLines.push(`   配置文件: ${args.replayConfigPath}`);
      }

      if (result.stdout) {
        outputLines.push(`\n📝 输出:\n${result.stdout}`);
      }

      if (result.stderr) {
        outputLines.push(`\n⚠️ 错误输出:\n${result.stderr}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 回放失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 自动化工具数组
 */
export const automationTools: ToolDefinition[] = [weappAuto, weappAutoReplay];
