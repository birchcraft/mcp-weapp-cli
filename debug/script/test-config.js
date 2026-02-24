#!/usr/bin/env node
/**
 * 配置测试脚本
 */
import { configManager } from './dist/config.js';

console.log('=== 配置测试 ===\n');

// 测试 1: 获取当前配置
console.log('1. 当前配置:');
const config = configManager.getConfig();
console.log(JSON.stringify(config, null, 2));

// 测试 2: 检测 CLI 路径
console.log('\n2. 检测 CLI 路径:');
const cliPath = await configManager.detectCliPath();
console.log('检测结果:', cliPath);

// 测试 3: 验证配置
console.log('\n3. 验证配置:');
const validation = configManager.validate();
console.log('验证结果:', JSON.stringify(validation, null, 2));

console.log('\n=== 测试完成 ===');
