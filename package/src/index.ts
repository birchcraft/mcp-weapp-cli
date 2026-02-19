import { MCPServer } from './server/mcp-server';
import { WeappTools } from './tools/weapp-tools';
import { LogLevel, ServerConfig, CliConfig } from './types';
import { Logger } from './utils/logger';

/**
 * 微信小程序 MCP 客户端主类
 */
export class WeappMCPClient {
  private server: MCPServer;
  private weappTools: WeappTools;
  private logger: Logger;

  constructor(config?: Partial<ServerConfig & { cliConfig?: CliConfig }>) {
    const defaultConfig: ServerConfig = {
      name: 'weapp-devtools-mcp',
      version: '1.0.0',
      logLevel: LogLevel.INFO,
      maxRequestSize: 1024 * 1024, // 1MB
      timeout: 30000, // 30 seconds
      ...config,
    };

    this.logger = new Logger(defaultConfig.logLevel);
    this.server = new MCPServer(defaultConfig);
    this.weappTools = new WeappTools(config?.cliConfig);
    
    this.setupTools();
    this.setupResources();
    this.setupPrompts();
    this.setupToolHandlers();
  }

  /**
   * 设置 MCP 工具
   */
  private setupTools(): void {
    // 登录工具
    this.server.registerTool({
      name: 'weapp_login',
      description: '登录微信开发者工具',
      inputSchema: {
        type: 'object',
        properties: {
          qrFormat: {
            type: 'string',
            enum: ['terminal', 'image', 'base64'],
            description: '二维码格式',
            default: 'terminal'
          },
          qrSize: {
            type: 'string',
            enum: ['small', 'default'],
            description: '二维码大小',
            default: 'default'
          },
          qrOutput: {
            type: 'string',
            description: '二维码输出路径（可选）'
          },
          resultOutput: {
            type: 'string',
            description: '结果输出路径（可选）'
          }
        },
        required: []
      }
    });

    // 检查登录状态工具
    this.server.registerTool({
      name: 'weapp_check_login',
      description: '检查微信开发者工具登录状态',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });

    // 预览工具
    this.server.registerTool({
      name: 'weapp_preview',
      description: '生成微信小程序预览二维码',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          },
          qrFormat: {
            type: 'string',
            enum: ['terminal', 'image', 'base64'],
            description: '二维码格式',
            default: 'terminal'
          },
          qrSize: {
            type: 'string',
            enum: ['small', 'default'],
            description: '二维码大小',
            default: 'default'
          },
          qrOutput: {
            type: 'string',
            description: '二维码输出路径（可选）'
          },
          infoOutput: {
            type: 'string',
            description: '信息输出路径（可选）'
          }
        },
        required: ['project']
      }
    });

    // 自动预览工具
    this.server.registerTool({
      name: 'weapp_auto_preview',
      description: '自动预览微信小程序（无需二维码）',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          },
          infoOutput: {
            type: 'string',
            description: '信息输出路径（可选）'
          }
        },
        required: ['project']
      }
    });

    // 上传工具
    this.server.registerTool({
      name: 'weapp_upload',
      description: '上传微信小程序代码',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          },
          version: {
            type: 'string',
            description: '版本号'
          },
          desc: {
            type: 'string',
            description: '版本描述（可选）'
          },
          infoOutput: {
            type: 'string',
            description: '信息输出路径（可选）'
          }
        },
        required: ['project', 'version']
      }
    });

    // 构建 npm 工具
    this.server.registerTool({
      name: 'weapp_build_npm',
      description: '构建微信小程序 npm 包',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          },
          compileType: {
            type: 'string',
            enum: ['miniprogram', 'plugin'],
            description: '编译类型',
            default: 'miniprogram'
          }
        },
        required: ['project']
      }
    });

    // 清除缓存工具
    this.server.registerTool({
      name: 'weapp_clear_cache',
      description: '清除微信小程序项目缓存',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          }
        },
        required: ['project']
      }
    });

    // 启动工具
    this.server.registerTool({
      name: 'weapp_open_tool',
      description: '启动微信开发者工具',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径（可选）'
          }
        },
        required: []
      }
    });

    // 关闭项目工具
    this.server.registerTool({
      name: 'weapp_close_project',
      description: '关闭微信开发者工具项目',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          }
        },
        required: ['project']
      }
    });

    // 退出工具
    this.server.registerTool({
      name: 'weapp_quit_tool',
      description: '退出微信开发者工具',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });

    // 云函数列表工具
    this.server.registerTool({
      name: 'weapp_cloud_functions_list',
      description: '获取微信小程序云函数列表',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          }
        },
        required: ['project']
      }
    });

    // 部署云函数工具
    this.server.registerTool({
      name: 'weapp_cloud_functions_deploy',
      description: '部署微信小程序云函数',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: '项目路径'
          },
          functionName: {
            type: 'string',
            description: '云函数名称'
          },
          functionPath: {
            type: 'string',
            description: '云函数相对路径'
          }
        },
        required: ['project', 'functionName', 'functionPath']
      }
    });

    // CLI 路径管理工具
    this.server.registerTool({
      name: 'weapp_set_cli_path',
      description: '设置微信开发者工具 CLI 路径',
      inputSchema: {
        type: 'object',
        properties: {
          cliPath: {
            type: 'string',
            description: 'CLI 工具路径'
          }
        },
        required: ['cliPath']
      }
    });

    // 获取 CLI 路径工具
    this.server.registerTool({
      name: 'weapp_get_cli_path',
      description: '获取当前微信开发者工具 CLI 路径',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    this.server.on('tool:weapp_login', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.login(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('登录失败'));
      }
    });

    this.server.on('tool:weapp_check_login', async (_args: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.checkLogin();
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('检查登录状态失败'));
      }
    });

    this.server.on('tool:weapp_preview', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.preview(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('预览失败'));
      }
    });

    this.server.on('tool:weapp_auto_preview', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.autoPreview(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('自动预览失败'));
      }
    });

    this.server.on('tool:weapp_upload', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.upload(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('上传失败'));
      }
    });

    this.server.on('tool:weapp_build_npm', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.buildNpm(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('构建npm失败'));
      }
    });

    this.server.on('tool:weapp_clear_cache', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.clearCache(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('清理缓存失败'));
      }
    });

    this.server.on('tool:weapp_open_tool', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.openTool(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('打开工具失败'));
      }
    });

    this.server.on('tool:weapp_close_project', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.closeProject(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('关闭项目失败'));
      }
    });

    this.server.on('tool:weapp_quit_tool', async (_args: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.quitTool();
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('退出工具失败'));
      }
    });

    this.server.on('tool:weapp_cloud_functions_list', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.getCloudFunctionsList(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('获取云函数列表失败'));
      }
    });

    this.server.on('tool:weapp_cloud_functions_deploy', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const result = await this.weappTools.deployCloudFunction(params);
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('部署云函数失败'));
      }
    });

    this.server.on('tool:weapp_set_cli_path', async (params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        this.weappTools.setCliPath(params.cliPath);
        const result = {
          success: true,
          message: `CLI 路径已设置为: ${params.cliPath}`,
          code: 0,
          stdout: '',
          stderr: ''
        };
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('设置CLI路径失败'));
      }
    });

    this.server.on('tool:weapp_get_cli_path', async (_params: any, callback: (error: Error | null, result?: any) => void) => {
      try {
        const cliPath = await this.weappTools.getCliPath();
        const result = {
          success: !!cliPath,
          message: cliPath ? `当前 CLI 路径: ${cliPath}` : '未找到 CLI 路径',
          code: 0,
          stdout: cliPath || '',
          stderr: ''
        };
        callback(null, result);
      } catch (error) {
        callback(error instanceof Error ? error : new Error('获取CLI路径失败'));
      }
    });
  }

  /**
   * 设置 MCP 资源
   */
  private setupResources(): void {
    // 项目配置资源
    this.server.registerResource({
      uri: 'weapp://project/config',
      name: '项目配置',
      description: '微信小程序项目配置信息',
      mimeType: 'application/json'
    });

    // CLI 状态资源
    this.server.registerResource({
      uri: 'weapp://cli/status',
      name: 'CLI 状态',
      description: '微信开发者工具 CLI 状态信息',
      mimeType: 'application/json'
    });
  }

  /**
   * 设置 MCP 提示符
   */
  private setupPrompts(): void {
    this.server.registerPrompt({
      name: 'weapp_project_setup',
      description: '微信小程序项目设置向导',
      arguments: [
        {
          name: 'projectPath',
          description: '项目路径',
          required: true
        },
        {
          name: 'appid',
          description: '小程序 AppID',
          required: false
        }
      ]
    });

    this.server.registerPrompt({
      name: 'weapp_deploy_guide',
      description: '微信小程序部署指南',
      arguments: [
        {
          name: 'version',
          description: '版本号',
          required: true
        },
        {
          name: 'environment',
          description: '部署环境',
          required: false
        }
      ]
    });
  }

  /**
   * 启动 MCP 服务器
   */
  public async start(): Promise<void> {
    try {
      await this.server.start();
      this.logger.info('微信小程序 MCP 服务器启动成功');
    } catch (error) {
      this.logger.error('微信小程序 MCP 服务器启动失败', { error });
      throw error;
    }
  }

  /**
   * 停止 MCP 服务器
   */
  public async stop(): Promise<void> {
    try {
      await this.server.stop();
      this.logger.info('微信小程序 MCP 服务器已停止');
    } catch (error) {
      this.logger.error('微信小程序 MCP 服务器停止失败', { error });
      throw error;
    }
  }

  /**
   * 处理 MCP 请求
   */
  public async handleRequest(request: any): Promise<any> {
    return await this.server.handleRequest(request);
  }

  /**
   * 获取 MCP 服务器实例
   */
  public getServer(): MCPServer {
    return this.server;
  }
}

// 导出所有模块
export { MCPServer } from './server/mcp-server';
export { WeappTools } from './tools/weapp-tools';
export * from './types';
export { Logger } from './utils/logger';

// 默认导出
export default WeappMCPClient;

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const client = new WeappMCPClient({
    name: '微信小程序开发工具 MCP 服务器',
    version: '1.0.0',
    logLevel: LogLevel.INFO
  });

  // 设置 stdio 处理
  process.stdin.setEncoding('utf8');
  process.stdout.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    
    // 处理完整的 JSON-RPC 消息
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      
      if (line) {
        try {
          const request = JSON.parse(line);
          const response = await client.handleRequest(request);
          process.stdout.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
              data: error instanceof Error ? error.message : String(error)
            }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    }
  });
  
  process.stdin.on('end', async () => {
    await client.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.error('\n正在关闭服务器...');
    try {
      await client.stop();
      process.exit(0);
    } catch (error) {
      console.error('关闭服务器失败:', error);
      process.exit(1);
    }
  });
  
  client.start().catch((error) => {
    console.error('启动服务器失败:', error);
    process.exit(1);
  });
}