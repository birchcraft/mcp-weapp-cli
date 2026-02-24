/**
 * 状态检测工具模块
 * 提供检测微信开发者工具运行状态、端口信息等功能
 */

import { createConnection } from 'net';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { formatError } from '../utils/helpers.js';

const execAsync = promisify(exec);

/**
 * 检查端口是否被监听
 */
function checkPortListening(port: number, host: string = 'localhost', timeout: number = 2000): Promise<boolean> {
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
 * 从 CLI 输出中解析 HTTP server 端口
 */
function parseHttpPort(output: string): number | null {
  // 匹配 "listening on http://127.0.0.1:PORT" 或类似格式
  const match = output.match(/listening on http:\/\/[^:]+:(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * 检测端口范围内的监听端口
 */
async function findListeningPorts(startPort: number, endPort: number): Promise<number[]> {
  const listeningPorts: number[] = [];
  const checkPromises: Promise<void>[] = [];
  
  for (let port = startPort; port <= endPort; port++) {
    checkPromises.push(
      checkPortListening(port).then(isListening => {
        if (isListening) {
          listeningPorts.push(port);
        }
      })
    );
  }
  
  await Promise.all(checkPromises);
  return listeningPorts.sort((a, b) => a - b);
}

/**
 * 获取微信开发者工具进程信息
 */
async function getWechatDevToolsProcesses(): Promise<Array<{ pid: string; port?: number }>> {
  try {
    // Windows 使用 tasklist 和 netstat
    if (process.platform === 'win32') {
      // 获取 wechatdevtools.exe 进程
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq wechatdevtools.exe" /FO CSV /NH');
      const processes: Array<{ pid: string; port?: number }> = [];
      
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          processes.push({ pid: parts[1].trim() });
        }
      }
      
      // 获取这些进程监听的端口
      try {
        const { stdout: netstatOut } = await execAsync('netstat -ano | findstr LISTENING');
        const netstatLines = netstatOut.trim().split('\n');
        
        for (const proc of processes) {
          for (const line of netstatLines) {
            if (line.includes(proc.pid)) {
              // 解析端口
              const match = line.match(/:(\d+)/);
              if (match) {
                proc.port = parseInt(match[1], 10);
                break;
              }
            }
          }
        }
      } catch {
        // 忽略 netstat 错误
      }
      
      return processes;
    }
    
    // macOS/Linux
    const { stdout } = await execAsync('ps aux | grep -i "wechatdevtools\\|微信开发者工具" | grep -v grep');
    const lines = stdout.trim().split('\n');
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return { pid: parts[1] };
    });
  } catch {
    return [];
  }
}

/**
 * 执行状态检测工具
 */
async function executeStatus(args: {
  checkHttpPort?: boolean;
  checkAutoPort?: number;
  scanPortRange?: { start: number; end: number };
}): Promise<ToolResult> {
  const outputLines: string[] = ['🔍 微信开发者工具状态检测'];
  const details: Record<string, unknown> = {};
  
  try {
    // 1. 检查进程
    const processes = await getWechatDevToolsProcesses();
    details.processes = processes;
    outputLines.push(
      '',
      '📊 进程信息:',
      `   运行中的实例数: ${processes.length}`
    );
    
    if (processes.length > 0) {
      processes.forEach((proc, index) => {
        outputLines.push(`   [${index + 1}] PID: ${proc.pid}${proc.port ? `, 端口: ${proc.port}` : ''}`);
      });
    }
    
    // 2. 检测 HTTP server 端口（常用范围）
    if (args.checkHttpPort !== false) {
      outputLines.push('', '🌐 HTTP Server 端口检测 (50000-65535):');
      const httpPorts = await findListeningPorts(50000, 65535);
      details.httpPorts = httpPorts;
      
      if (httpPorts.length > 0) {
        outputLines.push(`   发现 ${httpPorts.length} 个监听端口: ${httpPorts.join(', ')}`);
        
        // 尝试检测哪个是微信开发者工具的 HTTP server
        for (const port of httpPorts.slice(0, 3)) {
          const isWeapp = await checkPortListening(port);
          if (isWeapp) {
            outputLines.push(`   ✅ 端口 ${port} 可能为微信开发者工具 HTTP Server`);
          }
        }
      } else {
        outputLines.push('   未检测到监听端口');
      }
    }
    
    // 3. 检测指定的自动化端口
    if (args.checkAutoPort) {
      outputLines.push('', `🤖 自动化端口检测 (${args.checkAutoPort}):`);
      const isListening = await checkPortListening(args.checkAutoPort);
      details.autoPortListening = isListening;
      outputLines.push(isListening 
        ? `   ✅ 端口 ${args.checkAutoPort} 正在监听 (WebSocket)`
        : `   ❌ 端口 ${args.checkAutoPort} 未监听`
      );
    }
    
    // 4. 扫描常用自动化端口
    if (args.scanPortRange) {
      const { start, end } = args.scanPortRange;
      outputLines.push('', `🔎 扫描自动化端口范围 (${start}-${end}):`);
      const autoPorts = await findListeningPorts(start, end);
      details.scannedPorts = autoPorts;
      
      if (autoPorts.length > 0) {
        outputLines.push(`   发现监听端口: ${autoPorts.join(', ')}`);
      } else {
        outputLines.push('   未发现监听端口');
      }
    }
    
    // 5. 尝试检查登录状态（可以验证 CLI 是否正常工作）
    try {
      outputLines.push('', '🔑 CLI 连接测试:');
      const loginResult = await cliClient.checkLogin();
      details.cliConnected = loginResult.success;
      outputLines.push(loginResult.success 
        ? '   ✅ CLI 可以正常连接 IDE'
        : '   ⚠️ CLI 连接失败，IDE 可能未启动或未开启 CLI/HTTP 调用'
      );
      
      // 如果有输出，尝试解析 HTTP 端口
      const combinedOutput = `${loginResult.stdout || ''} ${loginResult.stderr || ''}`;
      const httpPort = parseHttpPort(combinedOutput);
      if (httpPort) {
        details.parsedHttpPort = httpPort;
        outputLines.push(`   📍 从输出解析到 HTTP Server 端口: ${httpPort}`);
      }
    } catch (cliError) {
      details.cliConnected = false;
      outputLines.push(`   ❌ CLI 连接错误: ${formatError(cliError)}`);
    }
    
    // 6. 给出建议
    outputLines.push(
      '',
      '💡 建议:',
      '   1. 如果存在多个实例，建议先执行 weapp_quit 关闭所有实例',
      '   2. 然后使用 weapp_auto 重新开启自动化功能',
      '   3. 如果自动化端口被占用，尝试使用其他端口（如 9421、9422）'
    );
    
    return {
      content: [
        {
          type: 'text',
          text: outputLines.join('\n'),
        },
        {
          type: 'text',
          text: JSON.stringify(details, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ 状态检测失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行关闭所有实例工具
 */
async function executeKillAll(): Promise<ToolResult> {
  const outputLines: string[] = ['🛑 关闭所有微信开发者工具实例'];
  
  try {
    // 1. 首先尝试正常退出
    try {
      await cliClient.quit();
      outputLines.push('   已发送退出命令');
    } catch {
      // 忽略错误
    }
    
    // 2. 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. 强制终止剩余进程（Windows）
    if (process.platform === 'win32') {
      try {
        await execAsync('taskkill /F /IM wechatdevtools.exe /T 2>nul');
        outputLines.push('   已强制终止所有 wechatdevtools.exe 进程');
      } catch {
        outputLines.push('   没有需要强制终止的进程');
      }
    } else {
      // macOS/Linux
      try {
        await execAsync('pkill -9 -f "wechatdevtools"');
        outputLines.push('   已强制终止所有微信开发者工具进程');
      } catch {
        outputLines.push('   没有需要强制终止的进程');
      }
    }
    
    // 4. 再次检查
    await new Promise(resolve => setTimeout(resolve, 1000));
    const remaining = await getWechatDevToolsProcesses();
    
    if (remaining.length === 0) {
      outputLines.push('   ✅ 所有实例已关闭');
    } else {
      outputLines.push(`   ⚠️ 仍有 ${remaining.length} 个实例在运行`);
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
          text: `❌ 关闭实例失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 状态检测工具定义
 */
export const statusTools: ToolDefinition[] = [
  {
    name: 'weapp_status',
    description: '检测微信开发者工具的运行状态、端口信息和进程情况',
    inputSchema: {
      type: 'object',
      properties: {
        checkHttpPort: {
          type: 'boolean',
          description: '是否检测 HTTP Server 端口（默认 true）',
          default: true,
        },
        checkAutoPort: {
          type: 'number',
          description: '要检测的自动化端口（如 9420）',
        },
        scanPortRange: {
          type: 'object',
          description: '扫描自动化端口范围',
          properties: {
            start: { type: 'number', default: 9420 },
            end: { type: 'number', default: 9430 },
          },
        },
      },
    },
    handler: executeStatus,
  },
  {
    name: 'weapp_kill_all',
    description: '强制关闭所有微信开发者工具实例（用于解决多实例冲突问题）',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: executeKillAll,
  },
];

/**
 * 工具执行映射表（向后兼容）
 */
export const statusToolExecutors = {
  weapp_status: executeStatus,
  weapp_kill_all: executeKillAll,
};
