/**
 * CLI 客户端测试
 */
import { describe, it, beforeAll } from 'node:test';
import assert from 'node:assert';
import { cliClient } from '../src/cli-client.js';
import { configManager } from '../src/config.js';

describe('CLIClient', () => {
  beforeAll(async () => {
    // 设置测试配置
    configManager.updateConfig({
      port: 9420,
      lang: 'zh',
      debug: false,
    });
  });

  it('应该能够检测 CLI 路径', async () => {
    const cliPath = await configManager.detectCliPath();
    console.log('检测到的 CLI 路径:', cliPath);
    assert.ok(cliPath, '应该检测到 CLI 路径');
  });

  it('应该能够检查登录状态', async () => {
    await cliClient.initialize();
    const result = await cliClient.checkLogin();
    console.log('登录状态结果:', result);
    
    // 检查结果结构
    assert.ok(typeof result.success === 'boolean', '应该有 success 字段');
    assert.ok(typeof result.code === 'number', '应该有 code 字段');
    assert.ok(typeof result.stdout === 'string', '应该有 stdout 字段');
    assert.ok(typeof result.stderr === 'string', '应该有 stderr 字段');
  });
});
