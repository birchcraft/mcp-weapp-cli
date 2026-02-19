#!/usr/bin/env node
/**
 * MCP 服务器手工测试 - 验证返回内容是否包含详细信息
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');
const PROJECT_PATH = 'D:\\Projects\\XJtsMiniProg';

console.log('=== MCP 服务器详细内容验证 ===\n');

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
      if (response.result && response.result.content) {
        console.log('\n📥 响应内容:');
        response.result.content.forEach((c, i) => {
          console.log(`--- 内容 ${i} ---`);
          console.log(c.text);
          console.log('');
        });
        if (response.result.isError) {
          console.log('⚠️  isError:', response.result.isError);
        }
      }
    } catch (e) {}
  }
});

server.stderr.on('data', () => {});

function send(name, params = {}) {
  requestId++;
  const request = {
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: { name, arguments: params }
  };
  console.log(`📤 测试: ${name}`);
  server.stdin.write(JSON.stringify(request) + '\n');
}

async function runTests() {
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. 云环境列表 - 应该返回环境ID
  console.log('========== 1. 云环境列表 ==========');
  send('weapp_cloud_env_list', { project: PROJECT_PATH });
  await new Promise(r => setTimeout(r, 5000));
  
  // 2. 云函数列表 - 应该返回11个函数名称
  console.log('========== 2. 云函数列表 ==========');
  send('weapp_cloud_functions_list', { project: PROJECT_PATH, env: 'cloud1-2g4i4wgr150fed18' });
  await new Promise(r => setTimeout(r, 5000));
  
  // 3. 云函数部署 - 应该返回部署详情表格
  console.log('========== 3. 云函数部署 ==========');
  send('weapp_cloud_functions_deploy', { 
    project: PROJECT_PATH, 
    env: 'cloud1-2g4i4wgr150fed18', 
    names: ['quickstartFunctions'], 
    remoteNpmInstall: true 
  });
  await new Promise(r => setTimeout(r, 30000));
  
  // 4. 预览 - 应该返回大小信息
  console.log('========== 4. 预览二维码 ==========');
  send('weapp_preview', { project: PROJECT_PATH, qrFormat: 'base64' });
  await new Promise(r => setTimeout(r, 10000));
  
  // 5. 关闭项目
  console.log('========== 5. 关闭项目 ==========');
  send('weapp_close', { project: PROJECT_PATH });
  await new Promise(r => setTimeout(r, 5000));
  
  // 6. 打开项目
  console.log('========== 6. 打开项目 ==========');
  send('weapp_open', { project: PROJECT_PATH });
  await new Promise(r => setTimeout(r, 15000));
  
  console.log('=== 测试完成 ===');
  server.kill();
  process.exit(0);
}

setTimeout(runTests, 2000);
setTimeout(() => { server.kill(); process.exit(1); }, 120000);
