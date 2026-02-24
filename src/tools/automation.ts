/**
 * 自动化测试工具模块
 * 提供开启自动化功能和自动化测试回放功能
 */
import { createConnection } from 'net';
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { isValidProjectPath, formatError } from '../utils/helpers.js';

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
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.setTimeout(timeout);
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

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

  const autoPort = args.autoPort || 9420;
  const wsEndpoint = `ws://localhost:${autoPort}`;
  const outputLines: string[] = ['🤖 开启自动化功能'];

  try {
    // 前置检查：检测端口是否已被占用
    outputLines.push(`\n📋 前置检查:`);
    const portOccupied = await checkPortListening(autoPort);
    if (portOccupied) {
      outputLines.push(`   ⚠️ 端口 ${autoPort} 已被占用，可能存在其他自动化实例`);
      outputLines.push(`   建议: 尝试使用其他端口，或执行 weapp_kill_all 关闭所有实例后重试`);
    } else {
      outputLines.push(`   ✅ 端口 ${autoPort} 可用`);
    }

    // 执行自动化命令
    outputLines.push(`\n🚀 执行自动化命令...`);
    const result = await cliClient.auto(args.project, {
      autoPort: args.autoPort,
      autoAccount: args.autoAccount,
      trustProject: args.trustProject,
      ticket: args.ticket,
    });

    // 等待一小段时间让服务启动
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
    
    // 端口监听状态
    outputLines.push(`   自动化端口监听: ${isListening ? '✅ 正常' : '⚠️ 未检测到'}`);

    if (result.stdout) {
      outputLines.push('\n📝 CLI 输出:', result.stdout);
    }

    if (result.stderr) {
      outputLines.push('\n⚠️ CLI 错误输出:', result.stderr);
    }

    // 提供使用建议
    outputLines.push(
      '\n💡 使用提示:'
    );

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

    return {
      content: [
        {
          type: 'text',
          text: outputLines.join('\n'),
        },
      ],
    };
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
