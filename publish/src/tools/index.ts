/**
 * 工具注册中心
 * 统一导出所有工具定义
 */
import { ToolDefinition } from '../types.js';
import { authTools } from './auth.js';
import { previewTools } from './preview.js';
import { projectTools } from './project.js';
import { buildTools } from './build.js';
import { automationTools } from './automation.js';
import { cloudTools } from './cloud.js';

// 导出所有工具分类
export { authTools } from './auth.js';
export { previewTools } from './preview.js';
export { projectTools } from './project.js';
export { buildTools } from './build.js';
export { automationTools } from './automation.js';
export { cloudTools } from './cloud.js';

// 导出所有工具定义数组
export const allTools: ToolDefinition[] = [
  ...authTools,
  ...previewTools,
  ...projectTools,
  ...buildTools,
  ...automationTools,
  ...cloudTools,
];

// 工具数量统计
export const toolStats = {
  total: allTools.length,
  auth: authTools.length,
  preview: previewTools.length,
  project: projectTools.length,
  build: buildTools.length,
  automation: automationTools.length,
  cloud: cloudTools.length,
};

// 导出工具名称列表
export const toolNames = allTools.map((tool) => tool.name);
