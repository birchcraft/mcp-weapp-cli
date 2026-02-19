import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import {
  CliConfig,
  CliResult,
  CliDetectionResult,
  LoginParams,
  LoginResult,
  PreviewParams,
  PreviewResult,
  AutoPreviewParams,
  UploadParams,
  UploadResult,
  BuildNpmParams,
  BuildResult,
  CacheParams,
  ToolParams,
  CloudFunctionsListParams,
  CloudFunctionsDeployParams,
  WeappError,
} from '../types';
import { Logger } from '../utils/logger';

const access = promisify(fs.access);

/**
 * 微信小程序开发者工具 CLI 封装类
 */
export class WeappTools {
  private logger: Logger;
  private cliPath: string | null = null;
  private config: CliConfig;

  constructor(config: CliConfig = {}) {
    this.config = {
      port: 9420,
      lang: 'zh',
      debug: false,
      ...config,
    };
    this.logger = new Logger();
  }

  /**
   * 检测 CLI 工具路径
   */
  private async detectCliPath(): Promise<CliDetectionResult> {
    // 如果配置中指定了路径，优先使用
    if (this.config.cliPath) {
      try {
        await access(this.config.cliPath, fs.constants.F_OK);
        return { found: true, path: this.config.cliPath };
      } catch (error) {
        this.logger.warn('配置的 CLI 路径不存在', { path: this.config.cliPath, error });
        return { found: false, error: `配置的 CLI 路径不存在: ${this.config.cliPath}` };
      }
    }

    // 常见的 CLI 路径
    const commonPaths = [
      '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      '/Applications/微信开发者工具.app/Contents/MacOS/cli',
      process.env['WEAPP_CLI_PATH'],
    ].filter(Boolean) as string[];

    for (const cliPath of commonPaths) {
      try {
        await access(cliPath, fs.constants.F_OK);
        this.logger.info('找到 CLI 工具', { path: cliPath });
        return { found: true, path: cliPath };
      } catch {
        // 继续尝试下一个路径
      }
    }

    return {
      found: false,
      error: '未找到微信开发者工具 CLI，请确保已安装微信开发者工具并开启服务端口',
    };
  }

  /**
   * 初始化 CLI 工具
   */
  private async initializeCli(): Promise<void> {
    if (this.cliPath) {
      return;
    }

    const detection = await this.detectCliPath();
    if (!detection.found) {
      throw new WeappError(detection.error!, 'CLI_NOT_FOUND');
    }

    this.cliPath = detection.path!;
    this.logger.info('CLI 工具初始化成功', { path: this.cliPath });
  }

  /**
   * 执行 CLI 命令
   */
  private async executeCommand(
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<CliResult> {
    await this.initializeCli();

    const { timeout = 30000 } = options;

    return new Promise((resolve, reject) => {
      const child = spawn(this.cliPath!, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const result: CliResult = {
          success: code === 0,
          code: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        };

        if (code === 0) {
          this.logger.debug('CLI 命令执行成功', { args, result });
          resolve(result);
        } else {
          this.logger.error('CLI 命令执行失败', { args, result });
          reject(new WeappError(`CLI 命令执行失败: ${stderr || stdout}`, 'CLI_COMMAND_FAILED', result));
        }
      });

      child.on('error', (error) => {
        this.logger.error('CLI 命令执行出错', { args, error });
        reject(new WeappError(`CLI 命令执行出错: ${error.message}`, 'CLI_COMMAND_ERROR', { error }));
      });
    });
  }

  /**
   * 构建通用参数
   */
  private buildCommonArgs(): string[] {
    const args: string[] = [];

    if (this.config.port) {
      args.push('--port', this.config.port.toString());
    }

    if (this.config.lang) {
      args.push('--lang', this.config.lang);
    }

    if (this.config.debug) {
      args.push('--debug');
    }

    return args;
  }

  /**
   * 验证项目路径
   */
  private async validateProject(projectPath: string): Promise<void> {
    try {
      await access(projectPath, fs.constants.F_OK);
    } catch {
      throw new WeappError(
        `项目路径不存在: ${projectPath}`,
        'PROJECT_PATH_NOT_FOUND',
        { projectPath }
      );
    }

    // 检查是否为有效的小程序项目
    const configPath = path.join(projectPath, 'project.config.json');
    try {
      await access(configPath, fs.constants.F_OK);
    } catch {
      throw new WeappError(
        `项目配置文件不存在: ${configPath}`,
        'PROJECT_CONFIG_NOT_FOUND',
        { projectPath, configPath }
      );
    }
  }

  /**
   * 登录开发者工具
   */
  public async login(params: LoginParams = {}): Promise<LoginResult> {
    const args = ['login', ...this.buildCommonArgs()];

    if (params.qrFormat) {
      args.push('--qr-format', params.qrFormat);
    }

    if (params.qrSize) {
      args.push('--qr-size', params.qrSize);
    }

    if (params.qrOutput) {
      args.push('--qr-output', params.qrOutput);
    }

    if (params.resultOutput) {
      args.push('--result-output', params.resultOutput);
    }

    const result = await this.executeCommand(args);
    
    const loginResult: LoginResult = { ...result };
    if (params.qrOutput) {
      loginResult.qrCodePath = params.qrOutput;
    }
    if (params.resultOutput) {
      loginResult.resultPath = params.resultOutput;
    }
    
    return loginResult;
  }

  /**
   * 检查登录状态
   */
  public async checkLogin(): Promise<CliResult> {
    const args = ['islogin', ...this.buildCommonArgs()];
    return this.executeCommand(args);
  }

  /**
   * 生成预览二维码
   */
  public async preview(params: PreviewParams): Promise<PreviewResult> {
    await this.validateProject(params.project);

    const args = ['preview', '--project', params.project, ...this.buildCommonArgs()];

    if (params.qrFormat) {
      args.push('--qr-format', params.qrFormat);
    }

    if (params.qrSize) {
      args.push('--qr-size', params.qrSize);
    }

    if (params.qrOutput) {
      args.push('--qr-output', params.qrOutput);
    }

    if (params.infoOutput) {
      args.push('--info-output', params.infoOutput);
    }

    const result = await this.executeCommand(args);
    
    const previewResult: PreviewResult = { ...result };
    if (params.qrOutput) {
      previewResult.qrCodePath = params.qrOutput;
    }
    if (params.infoOutput) {
      previewResult.infoPath = params.infoOutput;
    }
    
    return previewResult;
  }

  /**
   * 自动预览
   */
  public async autoPreview(params: AutoPreviewParams): Promise<PreviewResult> {
    await this.validateProject(params.project);

    const args = ['auto-preview', '--project', params.project, ...this.buildCommonArgs()];

    if (params.infoOutput) {
      args.push('--info-output', params.infoOutput);
    }

    const result = await this.executeCommand(args);
    
    const previewResult: PreviewResult = { ...result };
    if (params.infoOutput) {
      previewResult.infoPath = params.infoOutput;
    }
    
    return previewResult;
  }

  /**
   * 上传代码
   */
  public async upload(params: UploadParams): Promise<UploadResult> {
    await this.validateProject(params.project);

    const args = [
      'upload',
      '--project', params.project,
      '--version', params.version,
      ...this.buildCommonArgs()
    ];

    if (params.desc) {
      args.push('--desc', params.desc);
    }

    if (params.infoOutput) {
      args.push('--info-output', params.infoOutput);
    }

    const result = await this.executeCommand(args);
    
    const uploadResult: UploadResult = { ...result };
    if (params.infoOutput) {
      uploadResult.infoPath = params.infoOutput;
    }
    
    return uploadResult;
  }

  /**
   * 构建 npm
   */
  public async buildNpm(params: BuildNpmParams): Promise<BuildResult> {
    await this.validateProject(params.project);

    const args = ['build-npm', '--project', params.project, ...this.buildCommonArgs()];

    if (params.compileType) {
      args.push('--compile-type', params.compileType);
    }

    return this.executeCommand(args);
  }

  /**
   * 清除缓存
   */
  public async clearCache(params: CacheParams): Promise<CliResult> {
    await this.validateProject(params.project);

    const args = ['cache', '--project', params.project, ...this.buildCommonArgs()];
    return this.executeCommand(args);
  }

  /**
   * 启动工具
   */
  public async openTool(params: ToolParams = {}): Promise<CliResult> {
    const args = ['open', ...this.buildCommonArgs()];

    if (params.project) {
      await this.validateProject(params.project);
      args.push('--project', params.project);
    }

    return this.executeCommand(args);
  }

  /**
   * 关闭项目
   */
  public async closeProject(params: ToolParams): Promise<CliResult> {
    if (!params.project) {
      throw new WeappError('关闭项目需要指定项目路径', 'PROJECT_REQUIRED');
    }

    await this.validateProject(params.project);

    const args = ['close', '--project', params.project, ...this.buildCommonArgs()];
    return this.executeCommand(args);
  }

  /**
   * 退出工具
   */
  public async quitTool(): Promise<CliResult> {
    const args = ['quit', ...this.buildCommonArgs()];
    return this.executeCommand(args);
  }

  /**
   * 获取云函数列表
   */
  public async getCloudFunctionsList(params: CloudFunctionsListParams): Promise<CliResult> {
    await this.validateProject(params.project);

    const args = [
      'cloud', 'functions', 'list',
      '--project', params.project,
      ...this.buildCommonArgs()
    ];
    return this.executeCommand(args);
  }

  /**
   * 部署云函数
   */
  public async deployCloudFunction(params: CloudFunctionsDeployParams): Promise<CliResult> {
    await this.validateProject(params.project);

    const functionPath = path.resolve(params.project, params.functionPath);
    try {
      await access(functionPath, fs.constants.F_OK);
    } catch {
      throw new WeappError(
        `云函数路径不存在: ${functionPath}`,
        'FUNCTION_PATH_NOT_FOUND',
        { functionPath }
      );
    }

    const args = [
      'cloud', 'functions', 'deploy',
      '--project', params.project,
      '--function-name', params.functionName,
      '--function-path', params.functionPath,
      ...this.buildCommonArgs()
    ];
    return this.executeCommand(args);
  }

  /**
   * 设置 CLI 路径（用于手动配置）
   */
  public setCliPath(cliPath: string): void {
    this.config.cliPath = cliPath;
    this.cliPath = null; // 重置，下次使用时重新初始化
  }

  /**
   * 获取当前 CLI 路径
   */
  public async getCliPath(): Promise<string | null> {
    if (!this.cliPath) {
      const detection = await this.detectCliPath();
      return detection.found ? detection.path! : null;
    }
    return this.cliPath;
  }
}