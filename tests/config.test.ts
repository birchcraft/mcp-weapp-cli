/**
 * 配置管理测试
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ConfigManager } from '../src/config.js';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  it('应该有默认配置', () => {
    const config = configManager.getConfig();
    assert.ok(typeof config.port === 'number', '应该有默认端口');
    assert.ok(config.lang === 'en' || config.lang === 'zh', '应该有默认语言');
    assert.ok(typeof config.debug === 'boolean', '应该有默认调试设置');
  });

  it('应该能够更新配置', () => {
    configManager.updateConfig({ port: 8080, lang: 'en' });
    const config = configManager.getConfig();
    assert.strictEqual(config.port, 8080, '端口应该更新');
    assert.strictEqual(config.lang, 'en', '语言应该更新');
  });

  it('应该能够设置 CLI 路径', () => {
    const testPath = '/test/path/to/cli';
    configManager.setCliPath(testPath);
    const config = configManager.getConfig();
    assert.strictEqual(config.cliPath, testPath, 'CLI 路径应该设置');
  });

  it('应该能够验证配置', () => {
    // 有效配置
    const validResult = configManager.validate();
    assert.ok(typeof validResult.valid === 'boolean', '应该返回 valid 字段');
    assert.ok(Array.isArray(validResult.errors), '应该返回 errors 数组');
  });

  it('应该能够检测 CLI 路径', async () => {
    const detectedPath = await configManager.detectCliPath();
    console.log('检测到的 CLI 路径:', detectedPath);
    // 在开发环境中应该能检测到，但 CI 环境可能没有
    // 所以这里只检查方法能正常执行
    assert.ok(detectedPath === null || typeof detectedPath === 'string', '应该返回路径或 null');
  });
});
