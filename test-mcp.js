#!/usr/bin/env node
/**
 * MCP 服务器手动测试脚本
 * 用于验证所有工具是否正常工作
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('=== 微信小程序开发者工具 MCP 测试 ===\n');
console.log('服务器路径:', serverPath);

// 创建服务器进程
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WEAPP_PORT: '9420',
    WEAPP_LANG: 'zh',
    WEAPP_CLI_PATH: 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat'
  }
});

let stdout = '';
let stderr = '';

server.stdout.on('data', (data) => {
  stdout += data.toString();
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  stderr += data.toString();
  process.stderr.write(data);
});

// 等待服务器启动
setTimeout(() => {
  console.log('\n=== 发送测试请求 ===\n');

  // 测试 1: 初始化
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };

  console.log('发送初始化请求...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // 测试 2: 列出工具
  setTimeout(() => {
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    console.log('发送列出工具请求...');
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }, 1000);

  // 测试 3: 列出资源
  setTimeout(() => {
    const listResourcesRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list'
    };
    console.log('发送列出资源请求...');
    server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
  }, 2000);

  // 测试 4: 列出提示符
  setTimeout(() => {
    const listPromptsRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'prompts/list'
    };
    console.log('发送列出提示符请求...');
    server.stdin.write(JSON.stringify(listPromptsRequest) + '\n');
  }, 3000);

  // 测试 5: 检查登录状态
  setTimeout(() => {
    const checkLoginRequest = {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'weapp_check_login',
        arguments: {}
      }
    };
    console.log('发送检查登录状态请求...');
    server.stdin.write(JSON.stringify(checkLoginRequest) + '\n');
  }, 4000);

  // 结束测试
  setTimeout(() => {
    console.log('\n=== 测试完成 ===\n');
    server.kill();
    process.exit(0);
  }, 10000);

}, 2000);

// 超时处理
setTimeout(() => {
  console.log('\n=== 测试超时 ===\n');
  server.kill();
  process.exit(1);
}, 30000);

server.on('close', (code) => {
  console.log(`\n服务器进程退出，退出码: ${code}`);
});
