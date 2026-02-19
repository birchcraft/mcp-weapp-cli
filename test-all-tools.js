#!/usr/bin/env node
/**
 * 微信小程序开发者工具 MCP 完整功能测试脚本
 * 测试除登录外的所有功能
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');
const PROJECT_PATH = 'D:\\Projects\\XJtsMiniProg';

console.log('=== 微信小程序开发者工具 MCP 完整功能测试 ===\n');
console.log('项目路径:', PROJECT_PATH);

// 测试结果汇总
const results = [];

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  results.push({ name, status, details });
}

// 创建服务器进程
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WEAPP_PORT: '9420',
    WEAPP_LANG: 'zh'
  }
});

let requestId = 0;
const pendingRequests = new Map();

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(l => l.trim());
  for (const line of lines) {
    // 尝试解析 JSON-RPC 响应
    try {
      if (line.startsWith('{')) {
        const response = JSON.parse(line);
        if (response.id && pendingRequests.has(response.id)) {
          const { resolve } = pendingRequests.get(response.id);
          pendingRequests.delete(response.id);
          resolve(response);
        }
      }
    } catch {
      // 非 JSON 行，忽略
    }
  }
});

server.stderr.on('data', (data) => {
  // 忽略日志输出
});

function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    requestId++;
    const id = requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    pendingRequests.set(id, { resolve, reject });
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // 超时处理
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('请求超时'));
      }
    }, 30000);
  });
}

async function callTool(name, args = {}) {
  const response = await sendRequest('tools/call', { name, arguments: args });
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.result;
}

// 等待服务器启动
setTimeout(async () => {
  try {
    console.log('\n--- 开始测试 ---\n');
    
    // 1. 初始化
    console.log('1. 初始化 MCP 连接...');
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    logTest('初始化', 'PASS');
    
    // 2. 清缓存
    console.log('\n2. 测试清缓存功能...');
    try {
      const result = await callTool('weapp_clear_cache', { clean: 'all' });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('清缓存 (all)', 'PASS', '缓存清除成功');
      } else {
        logTest('清缓存 (all)', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('清缓存 (all)', 'FAIL', error.message);
    }
    
    // 3. 获取云环境列表
    console.log('\n3. 测试获取云环境列表...');
    try {
      const result = await callTool('weapp_cloud_env_list', { project: PROJECT_PATH });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('云环境列表', 'PASS', content.stdout?.substring(0, 100) || '获取成功');
      } else {
        logTest('云环境列表', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('云环境列表', 'FAIL', error.message);
    }
    
    // 4. 获取云函数列表（需要环境ID，先跳过具体调用，稍后根据上一步结果）
    console.log('\n4. 测试获取云函数列表...');
    try {
      // 尝试一个常见的环境ID格式
      const result = await callTool('weapp_cloud_functions_list', { 
        project: PROJECT_PATH,
        env: 'prod-wx5e9bde4d72a57427' 
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('云函数列表', 'PASS', content.stdout?.substring(0, 100) || '获取成功');
      } else {
        logTest('云函数列表', 'FAIL', content.error?.message || '可能需要正确的环境ID');
      }
    } catch (error) {
      logTest('云函数列表', 'FAIL', error.message);
    }
    
    // 5. 部署单个云函数（quickstartFunctions 是示例函数，通常存在）
    console.log('\n5. 测试部署云函数...');
    try {
      const result = await callTool('weapp_cloud_functions_deploy', { 
        project: PROJECT_PATH,
        env: 'prod-wx5e9bde4d72a57427',
        names: ['quickstartFunctions'],
        remoteNpmInstall: true
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('部署云函数', 'PASS', '部署成功');
      } else {
        logTest('部署云函数', 'FAIL', content.error?.message || '可能需要正确的环境ID');
      }
    } catch (error) {
      logTest('部署云函数', 'FAIL', error.message);
    }
    
    // 6. 预览
    console.log('\n6. 测试预览功能...');
    try {
      const result = await callTool('weapp_preview', { 
        project: PROJECT_PATH,
        qrFormat: 'base64'
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('预览', 'PASS', '预览二维码生成成功');
      } else {
        logTest('预览', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('预览', 'FAIL', error.message);
    }
    
    // 7. 自动预览
    console.log('\n7. 测试自动预览...');
    try {
      const result = await callTool('weapp_auto_preview', { 
        project: PROJECT_PATH
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('自动预览', 'PASS', '自动预览成功');
      } else {
        logTest('自动预览', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('自动预览', 'FAIL', error.message);
    }
    
    // 8. 构建 npm
    console.log('\n8. 测试构建 npm...');
    try {
      const result = await callTool('weapp_build_npm', { 
        project: PROJECT_PATH
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('构建 npm', 'PASS', 'npm 构建成功');
      } else {
        logTest('构建 npm', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('构建 npm', 'FAIL', error.message);
    }
    
    // 9. 关闭项目
    console.log('\n9. 测试关闭项目...');
    try {
      const result = await callTool('weapp_close', { 
        project: PROJECT_PATH
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('关闭项目', 'PASS', '项目关闭成功');
      } else {
        logTest('关闭项目', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('关闭项目', 'FAIL', error.message);
    }
    
    // 10. 重新打开项目
    console.log('\n10. 测试打开项目...');
    try {
      const result = await callTool('weapp_open', { 
        project: PROJECT_PATH
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('打开项目', 'PASS', '项目打开成功');
      } else {
        logTest('打开项目', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('打开项目', 'FAIL', error.message);
    }
    
    // 11. 重置文件监听
    console.log('\n11. 测试重置文件监听...');
    try {
      const result = await callTool('weapp_reset_fileutils', { 
        project: PROJECT_PATH
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('重置文件监听', 'PASS', '重置成功');
      } else {
        logTest('重置文件监听', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('重置文件监听', 'FAIL', error.message);
    }
    
    // 12. 自动化（仅测试调用，不验证结果）
    console.log('\n12. 测试开启自动化...');
    try {
      const result = await callTool('weapp_auto', { 
        project: PROJECT_PATH,
        autoPort: 9421
      });
      const content = JSON.parse(result.content[0].text);
      if (content.success) {
        logTest('开启自动化', 'PASS', '自动化已开启');
      } else {
        logTest('开启自动化', 'FAIL', content.error?.message || '未知错误');
      }
    } catch (error) {
      logTest('开启自动化', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('测试过程出错:', error);
  } finally {
    // 输出汇总
    console.log('\n=== 测试汇总 ===\n');
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    console.log(`总计: ${results.length} 项`);
    console.log(`✅ 通过: ${passCount} 项`);
    console.log(`❌ 失败: ${failCount} 项`);
    
    // 结束测试
    setTimeout(() => {
      server.kill();
      process.exit(failCount > 0 ? 1 : 0);
    }, 2000);
  }
}, 3000);

// 超时处理
setTimeout(() => {
  console.log('\n=== 测试超时 ===\n');
  server.kill();
  process.exit(1);
}, 300000);
