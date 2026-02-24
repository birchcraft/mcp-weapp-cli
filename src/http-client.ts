/**
 * HTTP 客户端模块
 * 负责与微信开发者工具 HTTP API 交互
 */
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { HTTPResult, HTTPPath, HTTPPortDetectionResult } from './types.js';
import { logger } from './utils/logger.js';
import { formatError } from './utils/helpers.js';

/**
 * HTTP 客户端类
 */
export class HTTPClient {
  private baseURL: string | null = null;
  private detectedPort: number | null = null;

  /**
   * 计算 MD5
   */
  private md5(input: string): string {
    return createHash('md5').update(input).digest('hex');
  }

  /**
   * 获取微信开发者工具安装路径
   */
  private getInstallPath(): string | null {
    const isWindows = platform() === 'win32';

    if (isWindows) {
      // Windows 常见安装路径
      const windowsPaths = [
        'C:\\Program Files (x86)\\Tencent\\微信web开发者工具',
        'C:\\Program Files\\Tencent\\微信web开发者工具',
        'D:\\微信web开发者工具',
        'E:\\微信web开发者工具',
        join(homedir(), 'AppData', 'Local', '微信开发者工具'),
      ];

      for (const path of windowsPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    } else {
      // macOS 安装路径
      const macPaths = [
        '/Applications/wechatwebdevtools.app/Contents/MacOS',
        '/Applications/微信开发者工具.app/Contents/MacOS',
      ];

      for (const path of macPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    }

    return null;
  }

  /**
   * 获取 nwVersion（Windows 专用）
   */
  private getNwVersion(installPath: string): string {
    try {
      const versionFile = join(installPath, 'version.json');
      if (existsSync(versionFile)) {
        const content = readFileSync(versionFile, 'utf-8');
        const version = JSON.parse(content);
        return version.latestNw || '';
      }
    } catch (error) {
      logger.debug('读取 version.json 失败:', formatError(error));
    }
    return '';
  }

  /**
   * 计算 .ide 文件路径的 MD5
   */
  private calculateIdeMd5(): string | null {
    const installPath = this.getInstallPath();
    if (!installPath) {
      logger.debug('无法找到微信开发者工具安装路径');
      return null;
    }

    logger.debug('安装路径:', installPath);

    let nwVersion = '';
    if (platform() === 'win32') {
      nwVersion = this.getNwVersion(installPath);
      logger.debug('nwVersion:', nwVersion);
    }

    // MD5 计算规则：MD5(`${installPath}${nwVersion}`)
    const md5Input = `${installPath}${nwVersion}`;
    const md5 = this.md5(md5Input);
    logger.debug('MD5 输入:', md5Input);
    logger.debug('MD5 结果:', md5);

    return md5;
  }

  /**
   * 获取 .ide 文件路径
   */
  private getIdeFilePath(): string | null {
    const isWindows = platform() === 'win32';
    const md5 = this.calculateIdeMd5();

    if (!md5) return null;

    if (isWindows) {
      // Windows: ~/AppData/Local/微信开发者工具/User Data/<MD5>/Default/.ide
      return join(homedir(), 'AppData', 'Local', '微信开发者工具', 'User Data', md5, 'Default', '.ide');
    } else {
      // macOS: ~/Library/Application Support/微信开发者工具/<MD5>/Default/.ide
      return join(homedir(), 'Library', 'Application Support', '微信开发者工具', md5, 'Default', '.ide');
    }
  }

  /**
   * 从 .ide 文件读取 HTTP 端口
   */
  async detectHttpPort(): Promise<HTTPPortDetectionResult> {
    try {
      const idePath = this.getIdeFilePath();

      if (!idePath) {
        return {
          found: false,
          error: '无法计算 .ide 文件路径',
        };
      }

      logger.debug('.ide 文件路径:', idePath);

      if (!existsSync(idePath)) {
        return {
          found: false,
          ideFilePath: idePath,
          error: '.ide 文件不存在，开发者工具可能未启动',
        };
      }

      const content = readFileSync(idePath, 'utf-8').trim();
      const port = parseInt(content, 10);

      if (isNaN(port) || port <= 0 || port > 65535) {
        return {
          found: false,
          ideFilePath: idePath,
          error: `.ide 文件内容无效: ${content}`,
        };
      }

      this.detectedPort = port;

      return {
        found: true,
        port,
        ideFilePath: idePath,
      };
    } catch (error) {
      return {
        found: false,
        error: `读取 HTTP 端口失败: ${formatError(error)}`,
      };
    }
  }

  /**
   * 设置 HTTP 端口
   */
  setHttpPort(port: number): void {
    this.detectedPort = port;
    this.baseURL = `http://127.0.0.1:${port}`;
  }

  /**
   * 获取当前的 HTTP 端口
   */
  getHttpPort(): number | null {
    return this.detectedPort;
  }

  /**
   * 获取 baseURL
   */
  getBaseURL(): string | null {
    if (this.baseURL) return this.baseURL;
    if (this.detectedPort) {
      return `http://127.0.0.1:${this.detectedPort}`;
    }
    return null;
  }

  /**
   * 确保 HTTP 客户端已准备好
   */
  private async ensureReady(): Promise<{ ready: boolean; error?: string }> {
    if (this.baseURL) {
      return { ready: true };
    }

    const detection = await this.detectHttpPort();

    if (detection.found && detection.port) {
      this.baseURL = `http://127.0.0.1:${detection.port}`;
      return { ready: true };
    }

    return { ready: false, error: detection.error };
  }

  /**
   * 发送 HTTP 请求
   */
  async request(path: string, params?: Record<string, any>): Promise<HTTPResult> {
    const readyCheck = await this.ensureReady();

    if (!readyCheck.ready) {
      return {
        success: false,
        statusCode: 0,
        data: null,
        error: readyCheck.error || 'HTTP 客户端未准备好',
      };
    }

    try {
      const url = new URL(path, this.baseURL!);

      // 添加 URL 参数
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              for (const item of value) {
                url.searchParams.append(key, String(item));
              }
            } else {
              url.searchParams.set(key, String(value));
            }
          }
        }
      }

      logger.debug('HTTP 请求:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      const statusCode = response.status;
      let data: any = null;

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text;
      }

      const success = statusCode >= 200 && statusCode < 300;

      return {
        success,
        statusCode,
        data,
        error: success ? undefined : `HTTP 错误: ${statusCode}`,
      };
    } catch (error) {
      logger.error('HTTP 请求失败:', formatError(error));
      return {
        success: false,
        statusCode: 0,
        data: null,
        error: `请求失败: ${formatError(error)}`,
      };
    }
  }

  /**
   * 检查 HTTP 服务是否可用
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.request(HTTPPath.IS_LOGIN);
    return result.success;
  }

  // ==================== HTTP API 方法 ====================

  /**
   * 登录
   */
  async login(options?: {
    qrFormat?: 'image' | 'base64' | 'terminal';
    qrOutput?: string;
    resultOutput?: string;
  }): Promise<HTTPResult> {
    return this.request(HTTPPath.LOGIN, options);
  }

  /**
   * 检查登录状态
   */
  async checkLogin(): Promise<HTTPResult> {
    return this.request(HTTPPath.IS_LOGIN);
  }

  /**
   * 预览
   */
  async preview(projectPath: string, options?: {
    qrFormat?: 'image' | 'base64' | 'terminal';
    qrOutput?: string;
    infoOutput?: string;
    compileCondition?: string;
  }): Promise<HTTPResult> {
    return this.request(HTTPPath.PREVIEW, {
      project: projectPath,
      ...options,
    });
  }

  /**
   * 上传
   */
  async upload(projectPath: string, version: string, desc?: string, options?: {
    infoOutput?: string;
  }): Promise<HTTPResult> {
    return this.request(HTTPPath.UPLOAD, {
      project: projectPath,
      version,
      desc,
      ...options,
    });
  }

  /**
   * 自动预览
   */
  async autoPreview(projectPath: string, options?: {
    infoOutput?: string;
  }): Promise<HTTPResult> {
    return this.request(HTTPPath.AUTO_PREVIEW, {
      project: projectPath,
      ...options,
    });
  }

  /**
   * 构建 npm
   */
  async buildNpm(projectPath: string, compileType?: 'miniprogram' | 'plugin'): Promise<HTTPResult> {
    return this.request(HTTPPath.BUILD_NPM, {
      project: projectPath,
      compileType,
    });
  }

  /**
   * 清除缓存
   */
  async clearCache(projectPath: string, clean: string): Promise<HTTPResult> {
    return this.request(HTTPPath.CLEAN_CACHE, {
      project: projectPath,
      clean,
    });
  }

  /**
   * 打开工具/项目
   */
  async open(projectPath?: string): Promise<HTTPResult> {
    const params: Record<string, any> = {};
    if (projectPath) {
      params.project = projectPath;
    }
    return this.request(HTTPPath.OPEN, params);
  }

  /**
   * 关闭项目
   */
  async close(projectPath: string): Promise<HTTPResult> {
    return this.request(HTTPPath.CLOSE, {
      project: projectPath,
    });
  }

  /**
   * 退出工具
   */
  async quit(): Promise<HTTPResult> {
    return this.request(HTTPPath.QUIT);
  }

  /**
   * 重置文件监听
   */
  async resetFileutils(): Promise<HTTPResult> {
    return this.request(HTTPPath.RESET_FILEUTILS);
  }

  // ==================== 云开发 HTTP API ====================

  /**
   * 获取云环境列表
   */
  async cloudEnvList(projectPath: string): Promise<HTTPResult> {
    return this.request(HTTPPath.CLOUD_ENV_LIST, {
      project: projectPath,
    });
  }

  /**
   * 获取云函数列表
   */
  async cloudFunctionsList(projectPath: string, env: string): Promise<HTTPResult> {
    return this.request(HTTPPath.CLOUD_FUNCTIONS_LIST, {
      project: projectPath,
      env,
    });
  }

  /**
   * 获取云函数信息
   */
  async cloudFunctionsInfo(projectPath: string, env: string, names: string[]): Promise<HTTPResult> {
    return this.request(HTTPPath.CLOUD_FUNCTIONS_INFO, {
      project: projectPath,
      env,
      names: names.join(','),
    });
  }

  /**
   * 部署云函数
   */
  async cloudFunctionsDeploy(
    projectPath: string,
    env: string,
    options: {
      names?: string[];
      paths?: string[];
      remoteNpmInstall?: boolean;
    } = {}
  ): Promise<HTTPResult> {
    const params: Record<string, any> = {
      project: projectPath,
      env,
    };

    if (options.names) {
      params.names = options.names.join(',');
    }

    if (options.paths) {
      params.paths = options.paths.join(' ');
    }

    if (options.remoteNpmInstall) {
      params['remote-npm-install'] = 'true';
    }

    return this.request(HTTPPath.CLOUD_FUNCTIONS_DEPLOY, params);
  }

  /**
   * 增量部署云函数
   */
  async cloudFunctionsIncDeploy(
    projectPath: string,
    env: string,
    options: {
      name?: string;
      path?: string;
      file?: string;
    } = {}
  ): Promise<HTTPResult> {
    const params: Record<string, any> = {
      project: projectPath,
      env,
    };

    if (options.name) {
      params.name = options.name;
    }

    if (options.path) {
      params.path = options.path;
    }

    if (options.file) {
      params.file = options.file;
    }

    return this.request(HTTPPath.CLOUD_FUNCTIONS_INC_DEPLOY, params);
  }

  /**
   * 下载云函数
   */
  async cloudFunctionsDownload(
    projectPath: string,
    env: string,
    name: string,
    path?: string
  ): Promise<HTTPResult> {
    const params: Record<string, any> = {
      project: projectPath,
      env,
      name,
    };

    if (path) {
      params.path = path;
    }

    return this.request(HTTPPath.CLOUD_FUNCTIONS_DOWNLOAD, params);
  }
}

// 导出单例
export const httpClient = new HTTPClient();
