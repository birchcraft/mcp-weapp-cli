/**
 * 辅助函数模块
 */
import { existsSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * 检查路径是否为有效的项目路径
 */
export function isValidProjectPath(projectPath: string): boolean {
  if (!projectPath) return false;
  if (!existsSync(projectPath)) return false;
  
  const stat = statSync(projectPath);
  if (!stat.isDirectory()) return false;

  // 检查是否包含 project.config.json
  const configPath = join(projectPath, 'project.config.json');
  return existsSync(configPath);
}

/**
 * 解析项目路径
 */
export function resolveProjectPath(projectPath?: string): string | undefined {
  if (!projectPath) return undefined;
  return resolve(projectPath);
}

/**
 * 构建 CLI 参数
 */
export function buildArgs(
  params: Record<string, any>,
  mappings: Record<string, string>
): string[] {
  const args: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    const argName = mappings[key];
    if (!argName) continue;

    if (typeof value === 'boolean') {
      if (value) args.push(argName);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        args.push(argName, String(item));
      }
    } else {
      args.push(argName, String(value));
    }
  }

  return args;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 格式化错误信息
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 解析 JSON 安全地
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 截断字符串
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 验证版本号格式
 */
export function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

/**
 * 获取环境变量值（带默认值）
 */
export function getEnv(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * 检查是否在 CI 环境
 */
export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER
  );
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
