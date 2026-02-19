/**
 * CLI 客户端模块
 * 负责与微信开发者工具 CLI 交互
 */
import { spawn } from 'child_process';
import { platform } from 'os';
import { CLIResult, CLIExecuteOptions, CLICommand, CacheType, QRFormat, QRSize, CompileType } from './types.js';
import { configManager } from './config.js';
import { logger } from './utils/logger.js';
import { formatError } from './utils/helpers.js';

/**
 * CLI 客户端类
 */
export class CLIClient {
  private cliPath: string = '';
  private isInitialized = false;

  /**
   * 初始化 CLI 客户端
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 尝试自动检测 CLI 路径
    const detectedPath = await configManager.detectCliPath();
    if (detectedPath) {
      this.cliPath = detectedPath;
      logger.info(`CLI 路径: ${this.cliPath}`);
    } else {
      throw new Error(
        '无法找到微信开发者工具 CLI。请设置 WEAPP_CLI_PATH 环境变量或确保工具已安装。'
      );
    }

    this.isInitialized = true;
  }

  /**
   * 设置 CLI 路径
   */
  setCliPath(path: string): void {
    this.cliPath = path;
    configManager.setCliPath(path);
    this.isInitialized = true;
  }

  /**
   * 获取 CLI 路径
   */
  getCliPath(): string {
    return this.cliPath;
  }

  /**
   * 构建全局参数
   */
  private buildGlobalArgs(): string[] {
    const config = configManager.getConfig();
    const args: string[] = [];

    if (config.port) {
      args.push('--port', String(config.port));
    }

    if (config.lang) {
      args.push('--lang', config.lang);
    }

    if (config.debug) {
      args.push('--debug');
    }

    return args;
  }

  /**
   * 执行 CLI 命令
   */
  async execute(
    subCommand: string,
    args: string[] = [],
    options: CLIExecuteOptions = {}
  ): Promise<CLIResult> {
    await this.initialize();

    const { timeout = 300000, cwd, env } = options; // 默认5分钟超时
    const globalArgs = this.buildGlobalArgs();
    const allArgs = [subCommand, ...args, ...globalArgs];

    const isWindows = platform() === 'win32';
    
    // Windows 上执行 .bat 文件需要使用 cmd /c
    const spawnCommand = isWindows && this.cliPath.endsWith('.bat')
      ? 'cmd'
      : this.cliPath;
    const spawnArgs = isWindows && this.cliPath.endsWith('.bat')
      ? ['/c', this.cliPath, ...allArgs]
      : allArgs;
    
    logger.debug(`执行命令: ${spawnCommand} ${spawnArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(spawnCommand, spawnArgs, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | null = null;

      // 设置超时
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`命令执行超时 (${timeout}ms)`));
        }, timeout);
      }

      // 收集标准输出
      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        logger.debug('stdout:', chunk);
      });

      // 收集错误输出
      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        logger.debug('stderr:', chunk);
      });

      // 进程结束
      child.on('close', (code: number | null) => {
        if (timeoutId) clearTimeout(timeoutId);

        const result: CLIResult = {
          success: code === 0,
          code: code ?? -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        };

        logger.debug(`命令执行完成，退出码: ${code}`);
        resolve(result);
      });

      // 错误处理
      child.on('error', (error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        logger.error('命令执行失败:', formatError(error));
        reject(error);
      });
    });
  }

  // ==================== 登录相关 ====================

  /**
   * 登录
   */
  async login(
    qrFormat: QRFormat = 'terminal',
    qrSize?: QRSize,
    qrOutput?: string,
    resultOutput?: string
  ): Promise<CLIResult> {
    const args: string[] = ['--qr-format', qrFormat];

    if (qrSize && qrFormat === 'terminal') {
      args.push('--qr-size', qrSize);
    }

    if (qrOutput) {
      args.push('--qr-output', qrOutput);
    }

    if (resultOutput) {
      args.push('--result-output', resultOutput);
    }

    return this.execute(CLICommand.LOGIN, args, { timeout: 300000 }); // 登录可能需要较长时间
  }

  /**
   * 检查登录状态
   */
  async checkLogin(): Promise<CLIResult> {
    return this.execute(CLICommand.IS_LOGIN);
  }

  // ==================== 预览/上传 ====================

  /**
   * 预览
   */
  async preview(
    projectPath: string,
    qrFormat: QRFormat = 'terminal',
    qrOutput?: string,
    infoOutput?: string
  ): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath, '--qr-format', qrFormat];

    if (qrOutput) {
      args.push('--qr-output', qrOutput);
    }

    if (infoOutput) {
      args.push('--info-output', infoOutput);
    }

    return this.execute(CLICommand.PREVIEW, args, { timeout: 120000 });
  }

  /**
   * 自动预览
   */
  async autoPreview(projectPath: string, infoOutput?: string): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath];

    if (infoOutput) {
      args.push('--info-output', infoOutput);
    }

    return this.execute(CLICommand.AUTO_PREVIEW, args, { timeout: 120000 });
  }

  /**
   * 上传
   */
  async upload(
    projectPath: string,
    version: string,
    desc: string,
    infoOutput?: string
  ): Promise<CLIResult> {
    const args: string[] = [
      '--project', projectPath,
      '--version', version,
      '--desc', desc,
    ];

    if (infoOutput) {
      args.push('--info-output', infoOutput);
    }

    return this.execute(CLICommand.UPLOAD, args, { timeout: 300000 });
  }

  // ==================== 项目管理 ====================

  /**
   * 打开工具/项目
   */
  async open(projectPath?: string): Promise<CLIResult> {
    const args: string[] = [];
    if (projectPath) {
      args.push('--project', projectPath);
    }
    return this.execute(CLICommand.OPEN, args);
  }

  /**
   * 以其他模式打开
   */
  async openOther(projectPath: string): Promise<CLIResult> {
    return this.execute(CLICommand.OPEN_OTHER, ['--project', projectPath]);
  }

  /**
   * 关闭项目
   */
  async close(projectPath?: string): Promise<CLIResult> {
    const args: string[] = [];
    if (projectPath) {
      args.push('--project', projectPath);
    }
    return this.execute(CLICommand.CLOSE, args);
  }

  /**
   * 退出工具
   */
  async quit(): Promise<CLIResult> {
    return this.execute(CLICommand.QUIT);
  }

  // ==================== 构建 ====================

  /**
   * 构建 npm
   */
  async buildNpm(projectPath: string, compileType?: CompileType): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath];

    if (compileType) {
      args.push('--compile-type', compileType);
    }

    return this.execute(CLICommand.BUILD_NPM, args, { timeout: 120000 });
  }

  /**
   * 清除缓存
   */
  async clearCache(clean: CacheType): Promise<CLIResult> {
    return this.execute(CLICommand.CACHE, ['--clean', clean]);
  }

  // ==================== 自动化 ====================

  /**
   * 开启自动化
   */
  async auto(
    projectPath: string,
    options: {
      autoPort?: number;
      autoAccount?: string;
      trustProject?: boolean;
      ticket?: string;
    } = {}
  ): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath];

    if (options.autoPort) {
      args.push('--auto-port', String(options.autoPort));
    }

    if (options.autoAccount) {
      args.push('--auto-account', options.autoAccount);
    }

    if (options.trustProject) {
      args.push('--trust-project');
    }

    if (options.ticket) {
      args.push('--ticket', options.ticket);
    }

    return this.execute(CLICommand.AUTO, args);
  }

  /**
   * 自动化测试回放
   */
  async autoReplay(
    projectPath: string,
    options: {
      replayAll?: boolean;
      replayConfigPath?: string;
      trustProject?: boolean;
      ticket?: string;
    } = {}
  ): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath];

    if (options.replayAll) {
      args.push('--replay-all');
    }

    if (options.replayConfigPath) {
      args.push('--replay-config-path', options.replayConfigPath);
    }

    if (options.trustProject) {
      args.push('--trust-project');
    }

    if (options.ticket) {
      args.push('--ticket', options.ticket);
    }

    return this.execute(CLICommand.AUTO_REPLAY, args);
  }

  // ==================== 云开发 ====================

  /**
   * 获取云环境列表
   */
  async cloudEnvList(projectPath: string): Promise<CLIResult> {
    return this.execute(CLICommand.CLOUD_ENV_LIST, ['--project', projectPath]);
  }

  /**
   * 获取云函数列表
   */
  async cloudFunctionsList(projectPath: string, env: string): Promise<CLIResult> {
    return this.execute(CLICommand.CLOUD_FUNCTIONS_LIST, [
      '--project', projectPath,
      '--env', env,
    ]);
  }

  /**
   * 获取云函数信息
   */
  async cloudFunctionsInfo(
    projectPath: string,
    env: string,
    names: string[]
  ): Promise<CLIResult> {
    return this.execute(CLICommand.CLOUD_FUNCTIONS_INFO, [
      '--project', projectPath,
      '--env', env,
      '--names', ...names,
    ]);
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
  ): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath, '--env', env];

    if (options.names && options.names.length > 0) {
      args.push('--names', ...options.names);
    }

    if (options.paths && options.paths.length > 0) {
      args.push('--paths', ...options.paths);
    }

    if (options.remoteNpmInstall) {
      args.push('--remote-npm-install');
    }

    return this.execute(CLICommand.CLOUD_FUNCTIONS_DEPLOY, args, { timeout: 300000 });
  }

  /**
   * 增量部署云函数
   */
  async cloudFunctionsIncDeploy(
    projectPath: string,
    env: string,
    options: {
      names?: string[];
      paths?: string[];
      remoteNpmInstall?: boolean;
    } = {}
  ): Promise<CLIResult> {
    const args: string[] = ['--project', projectPath, '--env', env];

    if (options.names && options.names.length > 0) {
      args.push('--names', ...options.names);
    }

    if (options.paths && options.paths.length > 0) {
      args.push('--paths', ...options.paths);
    }

    if (options.remoteNpmInstall) {
      args.push('--remote-npm-install');
    }

    return this.execute(CLICommand.CLOUD_FUNCTIONS_INC_DEPLOY, args, { timeout: 300000 });
  }

  /**
   * 下载云函数
   */
  async cloudFunctionsDownload(
    projectPath: string,
    env: string,
    name: string
  ): Promise<CLIResult> {
    return this.execute(CLICommand.CLOUD_FUNCTIONS_DOWNLOAD, [
      '--project', projectPath,
      '--env', env,
      '--name', name,
    ]);
  }

  // ==================== 其他 ====================

  /**
   * 重置文件监听
   */
  async resetFileutils(projectPath?: string): Promise<CLIResult> {
    const args: string[] = [];
    if (projectPath) {
      args.push('--project', projectPath);
    }
    return this.execute(CLICommand.RESET_FILEUTILS, args);
  }

  /**
   * 引擎构建
   */
  async engineBuild(projectPath: string): Promise<CLIResult> {
    return this.execute(CLICommand.ENGINE_BUILD, [projectPath]);
  }
}

// 导出单例
export const cliClient = new CLIClient();
