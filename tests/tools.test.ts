/**
 * 工具定义测试
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { allTools, toolStats, toolNames } from '../src/tools/index.js';
import { authTools } from '../src/tools/auth.js';
import { previewTools } from '../src/tools/preview.js';
import { projectTools } from '../src/tools/project.js';
import { buildTools } from '../src/tools/build.js';
import { automationTools } from '../src/tools/automation.js';
import { cloudTools } from '../src/tools/cloud.js';

describe('工具定义', () => {
  it('应该有正确的工具总数', () => {
    console.log('工具统计:', toolStats);
    assert.strictEqual(allTools.length, toolStats.total, '工具总数应该匹配');
    assert.ok(toolStats.total >= 20, '应该至少有 20 个工具');
  });

  it('所有工具应该有必要的字段', () => {
    for (const tool of allTools) {
      assert.ok(tool.name, `工具应该有 name 字段`);
      assert.ok(tool.description, `${tool.name} 应该有 description 字段`);
      assert.ok(tool.inputSchema, `${tool.name} 应该有 inputSchema 字段`);
      assert.strictEqual(tool.inputSchema.type, 'object', `${tool.name} 的 inputSchema 类型应该是 object`);
      assert.ok(typeof tool.handler === 'function', `${tool.name} 应该有 handler 函数`);
    }
  });

  it('工具名称不应该重复', () => {
    const uniqueNames = new Set(toolNames);
    assert.strictEqual(uniqueNames.size, toolNames.length, '工具名称不应该重复');
  });

  it('认证工具应该正确配置', () => {
    assert.strictEqual(authTools.length, 2, '应该有 2 个认证工具');
    assert.ok(authTools.some(t => t.name === 'weapp_login'), '应该有 weapp_login 工具');
    assert.ok(authTools.some(t => t.name === 'weapp_check_login'), '应该有 weapp_check_login 工具');
  });

  it('预览工具应该正确配置', () => {
    assert.strictEqual(previewTools.length, 3, '应该有 3 个预览工具');
    assert.ok(previewTools.some(t => t.name === 'weapp_preview'), '应该有 weapp_preview 工具');
    assert.ok(previewTools.some(t => t.name === 'weapp_auto_preview'), '应该有 weapp_auto_preview 工具');
    assert.ok(previewTools.some(t => t.name === 'weapp_upload'), '应该有 weapp_upload 工具');
  });

  it('项目管理工具应该正确配置', () => {
    assert.strictEqual(projectTools.length, 4, '应该有 4 个项目管理工具');
    assert.ok(projectTools.some(t => t.name === 'weapp_open'), '应该有 weapp_open 工具');
    assert.ok(projectTools.some(t => t.name === 'weapp_open_other'), '应该有 weapp_open_other 工具');
    assert.ok(projectTools.some(t => t.name === 'weapp_close'), '应该有 weapp_close 工具');
    assert.ok(projectTools.some(t => t.name === 'weapp_quit'), '应该有 weapp_quit 工具');
  });

  it('构建工具应该正确配置', () => {
    assert.strictEqual(buildTools.length, 2, '应该有 2 个构建工具');
    assert.ok(buildTools.some(t => t.name === 'weapp_build_npm'), '应该有 weapp_build_npm 工具');
    assert.ok(buildTools.some(t => t.name === 'weapp_clear_cache'), '应该有 weapp_clear_cache 工具');
  });

  it('自动化工具应该正确配置', () => {
    assert.strictEqual(automationTools.length, 2, '应该有 2 个自动化工具');
    assert.ok(automationTools.some(t => t.name === 'weapp_auto'), '应该有 weapp_auto 工具');
    assert.ok(automationTools.some(t => t.name === 'weapp_auto_replay'), '应该有 weapp_auto_replay 工具');
  });

  it('云开发工具应该正确配置', () => {
    assert.strictEqual(cloudTools.length, 6, '应该有 6 个云开发工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_env_list'), '应该有 weapp_cloud_env_list 工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_functions_list'), '应该有 weapp_cloud_functions_list 工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_functions_info'), '应该有 weapp_cloud_functions_info 工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_functions_deploy'), '应该有 weapp_cloud_functions_deploy 工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_functions_inc_deploy'), '应该有 weapp_cloud_functions_inc_deploy 工具');
    assert.ok(cloudTools.some(t => t.name === 'weapp_cloud_functions_download'), '应该有 weapp_cloud_functions_download 工具');
  });
});
