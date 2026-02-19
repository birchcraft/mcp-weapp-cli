#!/usr/bin/env node

const { WeappMCPClient } = require('./dist/index.js');

// 创建 MCP 客户端实例
const client = new WeappMCPClient({
  name: '微信小程序开发工具 MCP 服务器',
  version: '1.0.0'
});

// 测试工具列表
async function testToolsList() {
  try {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await client.handleRequest(request);
    console.log('工具列表测试结果:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.result && response.result.tools) {
      console.log(`\n成功注册了 ${response.result.tools.length} 个工具:`);
      response.result.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 测试资源列表
async function testResourcesList() {
  try {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/list',
      params: {}
    };
    
    const response = await client.handleRequest(request);
    console.log('\n资源列表测试结果:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('资源测试失败:', error);
  }
}

// 测试提示符列表
async function testPromptsList() {
  try {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'prompts/list',
      params: {}
    };
    
    const response = await client.handleRequest(request);
    console.log('\n提示符列表测试结果:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('提示符测试失败:', error);
  }
}

// 运行所有测试
async function runTests() {
  console.log('开始测试 MCP 服务器功能...\n');
  
  await testToolsList();
  await testResourcesList();
  await testPromptsList();
  
  console.log('\n测试完成！');
}

runTests().catch(console.error);