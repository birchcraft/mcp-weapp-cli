/**
 * CLI 客户端模块
 * 负责与微信开发者工具 CLI 交互
 */
import { spawn } from 'child_process';
import { platform } from 'os';
import { CLIResult, CLIExecuteOptions, CLICommand, CacheType, QRFormat, QRSize, CompileType } from './types.js';
import { configManager } from './config.js';
import { logger } from './utils/logger.js';
import { formatError, sleep } from './utils/helpers.js';

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
  private buildGlobalArgs(options?: { port?: number; lang?: string; debug?: boolean }): string[] {
    const args: string[] = [];
    const config = configManager.getConfig();

    // 优先使用传入的参数，其次使用配置
    const port = options?.port ?? config.port;
    const lang = options?.lang ?? config.lang;
    const debug = options?.debug ?? config.debug;

    if (port) {
      args.push('--port', String(port));
    }

    if (lang) {
      args.push('--lang', lang);
    }

    if (debug) {
      args.push('--debug');
    }

    return args;
  }

  /**
   * 从 CLI 输出中解析 HTTP 端口号
   */
  private parseHttpPort(output: string): number | null {
    // 匹配 listening on http://127.0.0.1:port 或类似格式
    const patterns = [
      /listening on http:\/\/[^:]+:(\d+)/i,
      /http:\/\/127\.0\.0\.1:(\d+)/i,
      /http:\/\/localhost:(\d+)/i,
      /port[:\s]*(\d{4,5})/i,
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        const port = parseInt(match[1], 10);
        if (port > 0 && port < 65536) {
          return port;
        }
      }
    }

    return null;
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

    logger.debug(`执行命令: ${this.cliPath} ${subCommand} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(this.cliPath, [subCommand, ...args], {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        shell: true, // 使用 shell 执行，解决 Windows 上 .bat 文件的执行问题
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

  /**
   * 检测是否有其他正在运行的微信开发者工具实例
   * 通过尝试执行 status 命令来检测
   */
  async isRunning(): Promise<boolean> {
    try {
      const result = await this.status();
      // 如果命令成功执行，说明有实例在运行
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * 尝试关闭其他实例（带重试机制）
   * @param retryCount 重试次数
   * @returns 是否成功关闭
   */
  async ensureSingleInstance(retryCount = 3): Promise<{ success: boolean; message: string }> {
    const messages: string[] = [];

    for (let i = 0; i < retryCount; i++) {
      const isRunning = await this.isRunning();
      if (!isRunning) {
        return { success: true, message: messages.join('\n') || '没有其他实例在运行' };
      }

      messages.push(`第 ${i + 1} 次尝试关闭其他实例...`);

      try {
        // 尝试优雅关闭
        const result = await this.quit();
        if (result.success) {
          messages.push('发送关闭命令成功');
        } else {
          messages.push(`关闭命令返回: ${result.stderr || result.stdout}`);
        }
      } catch (error) {
        messages.push(`关闭命令执行失败: ${formatError(error)}`);
      }

      // 等待 2 秒让进程退出
      await sleep(2000);
    }

    // 再次检查
    const stillRunning = await this.isRunning();
    if (stillRunning) {
      messages.push('警告: 经过多次尝试后，仍有实例在运行');
      return { success: false, message: messages.join('\n') };
    }

    return { success: true, message: messages.join('\n') };
  }

  // ==================== 状态检测 ====================

  /**
   * 检测微信开发者工具运行状态
   */
  async status(): Promise<CLIResult> {
    // 使用 --version 或简单的命令来检测工具是否响应
    return this.execute('--version', [], { timeout: 10000 });
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

  // ==================== 项目管理（改造后）====================

  /**
   * 启动开发者工具（不带项目）
   * 会先检测并关闭其他运行中的实例
   * @returns 包含 httpPort 的扩展结果
   */
  async openTool(options?: {
    httpPort?: number;
    lang?: string;
    debug?: boolean;
  }): Promise<CLIResult & { httpPort?: number }> {
    // 1. 确保只有一个实例运行
    const closeResult = await this.ensureSingleInstance(3);
    if (!closeResult.success) {
      return {
        success: false,
        code: -1,
        stdout: '',
        stderr: `无法关闭其他实例: ${closeResult.message}`,
      };
    }

    // 2. 构建参数（包含全局参数）
    const globalArgs = this.buildGlobalArgs(options);

    // 3. 执行启动命令
    const result = await this.execute(CLICommand.OPEN, globalArgs, { timeout: 60000 });

    // 4. 解析 HTTP 端口号
    const combinedOutput = `${result.stdout} ${result.stderr}`;
    const httpPort = this.parseHttpPort(combinedOutput);

    return {
      ...result,
      httpPort: httpPort || undefined,
    };
  }

  /**
   * 打开指定项目
   * 会先确保没有其他项目实例运行
   * @returns 包含 httpPort 的扩展结果
   */
  async openProject(
    projectPath: string,
    options?: {
      httpPort?: number;
      lang?: string;
      debug?: boolean;
    }
  ): Promise<CLIResult & { httpPort?: number }> {
    // 1. 尝试关闭其他项目实例（多次）
    for (let i = 0; i < 3; i++) {
      try {
        await this.close(projectPath);
        await sleep(1500);
      } catch {
        // 忽略关闭错误
      }
    }

    // 2. 构建参数
    const args: string[] = ['--project', projectPath];
    const globalArgs = this.buildGlobalArgs(options);

    // 3. 执行打开命令
    const result = await this.execute(CLICommand.OPEN, [...args, ...globalArgs], { timeout: 60000 });

    // 4. 解析 HTTP 端口号
    const combinedOutput = `${result.stdout} ${result.stderr}`;
    const httpPort = this.parseHttpPort(combinedOutput);

    return {
      ...result,
      httpPort: httpPort || undefined,
    };
  }

  /**
   * 以其他模式打开
   */
  async openOther(projectPath: string): Promise<CLIResult> {
    return this.execute(CLICommand.OPEN_OTHER, ['--project', projectPath]);
  }

  /**
   * 关闭项目（带重试机制）
   */
  async close(projectPath?: string, retryCount = 1): Promise<CLIResult> {
    const args: string[] = [];
    if (projectPath) {
      args.push('--project', projectPath);
    }

    let lastResult: CLIResult = {
      success: false,
      code: -1,
      stdout: '',
      stderr: '',
    };

    for (let i = 0; i < retryCount; i++) {
      lastResult = await this.execute(CLICommand.CLOSE, args);
      if (lastResult.success) {
        return lastResult;
      }
      await sleep(1000);
    }

    return lastResult;
  }

  /**
   * 退出工具（带重试机制）
   */
  async quit(retryCount = 3): Promise<CLIResult> {
    let lastResult: CLIResult = {
      success: false,
      code: -1,
      stdout: '',
      stderr: '',
    };

    for (let i = 0; i < retryCount; i++) {
      lastResult = await this.execute(CLICommand.QUIT);
      if (lastResult.success) {
        return lastResult;
      }
      await sleep(1500);
    }

    return lastResult;
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
