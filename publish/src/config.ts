/**
 * 配置管理模块
 */
import { WeappConfig } from './types.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { execSync } from 'child_process';

// 默认配置
const DEFAULT_CONFIG: WeappConfig = {
  port: 9420,
  lang: 'zh',
  debug: false,
};

// Windows 常见安装路径
const WINDOWS_COMMON_PATHS = [
  'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat',
  'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat',
  'D:\\微信web开发者工具\\cli.bat',
  'E:\\微信web开发者工具\\cli.bat',
  join(homedir(), 'AppData', 'Local', '微信开发者工具', 'cli.bat'),
];

// macOS 常见安装路径
const MACOS_COMMON_PATHS = [
  '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
  '/Applications/微信开发者工具.app/Contents/MacOS/cli',
];

/**
 * 配置管理类
 */
export class ConfigManager {
  private config: WeappConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 加载配置（环境变量优先）
   */
  private loadConfig(): WeappConfig {
    return {
      cliPath: process.env.WEAPP_CLI_PATH,
      port: this.parsePort(process.env.WEAPP_PORT),
      lang: this.parseLang(process.env.WEAPP_LANG),
      debug: process.env.WEAPP_DEBUG === 'true',
      projectPath: process.env.WEAPP_PROJECT_PATH,
      appid: process.env.WEAPP_APPID,
      extAppid: process.env.WEAPP_EXT_APPID,
    };
  }

  /**
   * 解析端口
   */
  private parsePort(portStr: string | undefined): number | undefined {
    if (!portStr) return undefined;
    const port = parseInt(portStr, 10);
    return isNaN(port) ? undefined : port;
  }

  /**
   * 解析语言设置
   */
  private parseLang(langStr: string | undefined): 'en' | 'zh' | undefined {
    if (!langStr) return undefined;
    if (langStr === 'en' || langStr === 'zh') return langStr;
    return undefined;
  }

  /**
   * 获取当前配置
   */
  getConfig(): Required<WeappConfig> {
    return {
      cliPath: this.config.cliPath || '',
      port: this.config.port || DEFAULT_CONFIG.port || 9420,
      lang: this.config.lang || DEFAULT_CONFIG.lang || 'zh',
      debug: this.config.debug || DEFAULT_CONFIG.debug || false,
      projectPath: this.config.projectPath || '',
      appid: this.config.appid || '',
      extAppid: this.config.extAppid || '',
    };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<WeappConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 设置 CLI 路径
   */
  setCliPath(path: string): void {
    this.config.cliPath = path;
  }

  /**
   * 尝试从 PATH 中找到 CLI
   */
  private findCliInPath(): string | null {
    try {
      const isWindows = platform() === 'win32';
      
      if (isWindows) {
        // Windows: 使用 where 命令
        const result = execSync('cmd /c "where cli.bat"', { 
          encoding: 'utf-8', 
          stdio: ['pipe', 'pipe', 'ignore'] 
        });
        const paths = result.trim().split('\n').map(p => p.trim()).filter(p => p);
        
        for (const path of paths) {
          if (existsSync(path)) {
            return path;
          }
        }
      } else {
        // macOS/Linux: 使用 which 命令
        const result = execSync('which cli', { 
          encoding: 'utf-8', 
          stdio: ['pipe', 'pipe', 'ignore'] 
        });
        const path = result.trim();
        if (path && existsSync(path)) {
          return path;
        }
      }
    } catch {
      // 忽略错误，继续尝试其他方法
    }
    return null;
  }

  /**
   * 自动检测 CLI 路径
   */
  async detectCliPath(): Promise<string | null> {
    // 如果已配置，直接使用
    if (this.config.cliPath && existsSync(this.config.cliPath)) {
      return this.config.cliPath;
    }

    // 尝试从 PATH 中查找
    const pathCli = this.findCliInPath();
    if (pathCli) {
      this.config.cliPath = pathCli;
      return pathCli;
    }

    // 尝试常见安装路径
    const isWindows = platform() === 'win32';
    const paths = isWindows ? WINDOWS_COMMON_PATHS : MACOS_COMMON_PATHS;

    for (const path of paths) {
      if (existsSync(path)) {
        this.config.cliPath = path;
        return path;
      }
    }

    return null;
  }

  /**
   * 验证配置
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.cliPath && !existsSync(this.config.cliPath)) {
      errors.push(`CLI 路径不存在: ${this.config.cliPath}`);
    }

    if (this.config.port && (this.config.port < 1 || this.config.port > 65535)) {
      errors.push(`无效的端口号: ${this.config.port}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// 导出单例
export const configManager = new ConfigManager();
