#!/usr/bin/env node
/**
 * 构建脚本
 */
import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 开始构建...\n');

// TypeScript 编译
console.log('TypeScript 编译...');
try {
  execSync('npx tsc', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ 编译成功');
} catch (error) {
  console.error('❌ 编译失败');
  process.exit(1);
}

console.log('\n✅ 构建完成！');
