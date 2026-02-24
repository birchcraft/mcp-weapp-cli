#!/usr/bin/env node
/**
 * 完整功能测试 - 包括云函数操作
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');
const PROJECT_PATH = 'D:\\Projects\\XJtsMiniProg';

console.log('=== 微信小程序开发者工具 MCP 完整功能测试 ===\n');
console.log(`项目路径: ${PROJECT_PATH}\n`);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, WEAPP_PORT: '9420', WEAPP_LANG: 'zh' }
});

let buffer = '';
let requestId = 0;
const results = [];

function logResult(name, success, detail = '') {
  const icon = success ? '✅' : '❌';
  const status = success ? '成功' : '失败';
  results.push({ name, success, detail });
  console.log(`${icon} ${name}: ${status}${detail ? ' - ' + detail : ''}`);
}

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const response = JSON.parse(line);
        if (response.result && response.result.content) {
          const text = response.result.content[0]?.text || '';
          const isError = response.result.isError;
          
          // 根据请求ID匹配测试名称
          if (global.currentTest) {
            const success = !isError && (text.includes('成功') || text.includes('✓') || text.includes('✅'));
            logResult(global.currentTest, success, text.substring(0, 100));
            global.currentTest = null;
          }
        }
      } catch (e) {}
    }
  }
});

server.stderr.on('data', () => {});

function sendRequest(name, args, testName) {
  return new Promise((resolve) => {
    global.currentTest = testName;
    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: ++requestId,
        method: 'tools/call',
        params: { name, arguments: args }
      }) + '\n');
      setTimeout(resolve, 500);
    }, 100);
  });
}

async function runTests() {
  console.log('--- 基础功能测试 ---\n');
  
  // 1. 清缓存
  await sendRequest('weapp_clear_cache', { clean: 'all' }, '清缓存 (all)');
  await new Promise(r => setTimeout(r, 2000));
  
  await sendRequest('weapp_clear_cache', { clean: 'compile' }, '清缓存 (compile)');
  await new Promise(r => setTimeout(r, 2000));
  
  // 2. 云环境列表
  console.log('\n--- 云开发功能测试 ---\n');
  await sendRequest('weapp_cloud_env_list', { project: PROJECT_PATH }, '获取云环境列表');
  await new Promise(r => setTimeout(r, 5000));
  
  // 3. 云函数列表（需要环境ID，这里用常见的格式尝试）
  // 先尝试获取环境ID，如果失败就跳过
  await sendRequest('weapp_cloud_functions_list', { 
    project: PROJECT_PATH,
    env: 'prod-wx5e9bde4d72a57427'
  }, '获取云函数列表');
  await new Promise(r => setTimeout(r, 5000));
  
  // 4. 云函数信息
  await sendRequest('weapp_cloud_functions_info', {
    project: PROJECT_PATH,
    env: 'prod-wx5e9bde4d72a57427',
    names: ['quickstartFunctions']
  }, '获取云函数信息 (quickstartFunctions)');
  await new Promise(r => setTimeout(r, 5000));
  
  // 5. 部署云函数
  await sendRequest('weapp_cloud_functions_deploy', {
    project: PROJECT_PATH,
    env: 'prod-wx5e9bde4d72a57427',
    names: ['quickstartFunctions'],
    remoteNpmInstall: true
  }, '部署云函数 (quickstartFunctions)');
  await new Promise(r => setTimeout(r, 30000));
  
  console.log('\n--- 预览与构建测试 ---\n');
  
  // 6. 预览
  await sendRequest('weapp_preview', {
    project: PROJECT_PATH,
    qrFormat: 'base64'
  }, '生成预览二维码 (base64)');
  await new Promise(r => setTimeout(r, 10000));
  
  // 7. 自动预览
  await sendRequest('weapp_auto_preview', {
    project: PROJECT_PATH
  }, '自动预览');
  await new Promise(r => setTimeout(r, 15000));
  
  // 8. 构建 npm
  await sendRequest('weapp_build_npm', {
    projectPath: PROJECT_PATH
  }, '构建 npm');
  await new Promise(r => setTimeout(r, 15000));
  
  console.log('\n--- 项目管理测试 ---\n');
  
  // 9. 关闭项目
  await sendRequest('weapp_close', {
    project: PROJECT_PATH
  }, '关闭项目');
  await new Promise(r => setTimeout(r, 5000));
  
  // 10. 打开项目
  await sendRequest('weapp_open', {
    project: PROJECT_PATH
  }, '打开项目');
  await new Promise(r => setTimeout(r, 10000));
  
  // 11. 重置文件监听
  await sendRequest('weapp_reset_fileutils', {
    project: PROJECT_PATH
  }, '重置文件监听');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('\n--- 自动化测试 ---\n');
  
  // 12. 开启自动化
  await sendRequest('weapp_auto', {
    project: PROJECT_PATH,
    autoPort: 9421,
    trustProject: true
  }, '开启自动化');
  await new Promise(r => setTimeout(r, 10000));
  
  // 打印汇总
  console.log('\n=== 测试汇总 ===\n');
  const passCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`总计: ${results.length} 项`);
  console.log(`✅ 成功: ${passCount} 项`);
  console.log(`❌ 失败: ${failCount} 项`);
  
  if (failCount > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`);
    });
  }
  
  console.log('\n=== 测试完成 ===');
  server.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

setTimeout(runTests, 2000);

setTimeout(() => {
  console.log('\n=== 测试超时 ===');
  server.kill();
  process.exit(1);
}, 180000);
