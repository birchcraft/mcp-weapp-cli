#!/usr/bin/env node
/**
 * 简化版测试 - 直接输出返回内容
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');
const PROJECT_PATH = 'D:\\Projects\\XJtsMiniProg';

console.log('=== 微信小程序开发者工具 MCP 功能测试 ===\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, WEAPP_PORT: '9420', WEAPP_LANG: 'zh' }
});

let buffer = '';
let requestId = 0;

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // 保留不完整的行
  
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const response = JSON.parse(line);
        if (response.result) {
          console.log('响应内容:');
          if (response.result.content) {
            response.result.content.forEach(c => {
              console.log(c.text);
            });
          } else {
            console.log(JSON.stringify(response.result, null, 2));
          }
          console.log('---');
        }
      } catch (e) {
        // 忽略
      }
    }
  }
});

server.stderr.on('data', () => {});

function sendRequest(request) {
  return new Promise((resolve) => {
    setTimeout(() => {
      server.stdin.write(JSON.stringify(request) + '\n');
      resolve();
    }, 500);
  });
}

async function testTools() {
  // 初始化
  console.log('1. 初始化...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' }
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 测试清缓存
  console.log('\n2. 测试清缓存...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_clear_cache',
      arguments: { clean: 'all' }
    }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // 测试云环境列表
  console.log('\n3. 测试云环境列表...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_cloud_env_list',
      arguments: { project: PROJECT_PATH }
    }
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  // 测试预览
  console.log('\n4. 测试预览...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_preview',
      arguments: { project: PROJECT_PATH, qrFormat: 'base64' }
    }
  });
  
  await new Promise(r => setTimeout(r, 10000));
  
  // 测试构建 npm
  console.log('\n5. 测试构建 npm...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_build_npm',
      arguments: { projectPath: PROJECT_PATH }
    }
  });
  
  await new Promise(r => setTimeout(r, 15000));
  
  // 测试关闭项目
  console.log('\n6. 测试关闭项目...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_close',
      arguments: { project: PROJECT_PATH }
    }
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  // 测试打开项目
  console.log('\n7. 测试打开项目...');
  await sendRequest({
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'tools/call',
    params: {
      name: 'weapp_open',
      arguments: { project: PROJECT_PATH }
    }
  });
  
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('\n=== 测试完成 ===');
  server.kill();
  process.exit(0);
}

setTimeout(testTools, 2000);

setTimeout(() => {
  console.log('\n=== 超时 ===');
  server.kill();
  process.exit(1);
}, 120000);
