#!/usr/bin/env node
/**
 * MCP 服务器手工测试 - 逐个验证工具
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');
const PROJECT_PATH = 'D:\\Projects\\XJtsMiniProg';

console.log('=== MCP 服务器手工测试 ===\n');
console.log('项目路径:', PROJECT_PATH);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, WEAPP_PORT: '9420', WEAPP_LANG: 'zh' }
});

let requestId = 0;
const rl = readline.createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.trim().startsWith('{')) {
    try {
      const response = JSON.parse(line);
      console.log('\n📥 收到响应:');
      if (response.result) {
        if (response.result.content) {
          response.result.content.forEach((c, i) => {
            console.log(`  内容[${i}]:`, c.text);
          });
        } else {
          console.log(JSON.stringify(response.result, null, 2));
        }
        if (response.result.isError) {
          console.log('  ⚠️  isError:', response.result.isError);
        }
      } else if (response.error) {
        console.log('  ❌ 错误:', response.error);
      }
      console.log('');
    } catch (e) {}
  }
});

server.stderr.on('data', () => {});

function send(method, params = {}) {
  requestId++;
  const request = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params
  };
  console.log(`📤 发送请求: ${method}`);
  server.stdin.write(JSON.stringify(request) + '\n');
}

async function runTests() {
  // 等待服务器启动
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. 初始化
  console.log('--- 1. 初始化 ---');
  send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'manual-test', version: '1.0.0' }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // 2. 清缓存
  console.log('--- 2. 清缓存 (all) ---');
  send('tools/call', {
    name: 'weapp_clear_cache',
    arguments: { clean: 'all' }
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // 3. 获取云环境列表
  console.log('--- 3. 获取云环境列表 ---');
  send('tools/call', {
    name: 'weapp_cloud_env_list',
    arguments: { project: PROJECT_PATH }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  // 4. 获取云函数列表（使用正确的环境ID）
  console.log('--- 4. 获取云函数列表 ---');
  send('tools/call', {
    name: 'weapp_cloud_functions_list',
    arguments: { project: PROJECT_PATH, env: 'cloud1-2g4i4wgr150fed18' }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  // 5. 云函数信息
  console.log('--- 5. 获取云函数信息 (quickstartFunctions) ---');
  send('tools/call', {
    name: 'weapp_cloud_functions_info',
    arguments: { project: PROJECT_PATH, env: 'cloud1-2g4i4wgr150fed18', names: ['quickstartFunctions'] }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  // 6. 部署云函数
  console.log('--- 6. 部署云函数 (quickstartFunctions) ---');
  send('tools/call', {
    name: 'weapp_cloud_functions_deploy',
    arguments: { project: PROJECT_PATH, env: 'cloud1-2g4i4wgr150fed18', names: ['quickstartFunctions'], remoteNpmInstall: true }
  });
  await new Promise(r => setTimeout(r, 30000));
  
  // 7. 预览
  console.log('--- 7. 生成预览二维码 ---');
  send('tools/call', {
    name: 'weapp_preview',
    arguments: { project: PROJECT_PATH, qrFormat: 'base64' }
  });
  await new Promise(r => setTimeout(r, 10000));
  
  // 8. 自动预览
  console.log('--- 8. 自动预览 ---');
  send('tools/call', {
    name: 'weapp_auto_preview',
    arguments: { project: PROJECT_PATH }
  });
  await new Promise(r => setTimeout(r, 10000));
  
  // 9. 关闭项目
  console.log('--- 9. 关闭项目 ---');
  send('tools/call', {
    name: 'weapp_close',
    arguments: { project: PROJECT_PATH }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  // 10. 打开项目（可能会超时，设置更长等待）
  console.log('--- 10. 打开项目 ---');
  send('tools/call', {
    name: 'weapp_open',
    arguments: { project: PROJECT_PATH }
  });
  await new Promise(r => setTimeout(r, 15000));
  
  // 11. 重置文件监听
  console.log('--- 11. 重置文件监听 ---');
  send('tools/call', {
    name: 'weapp_reset_fileutils',
    arguments: { project: PROJECT_PATH }
  });
  await new Promise(r => setTimeout(r, 5000));
  
  // 结束
  console.log('=== 测试完成 ===');
  server.kill();
  process.exit(0);
}

setTimeout(runTests, 2000);

setTimeout(() => {
  console.log('\n=== 超时 ===');
  server.kill();
  process.exit(1);
}, 120000);
