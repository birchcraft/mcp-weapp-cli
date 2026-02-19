import {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCP_ERROR_CODES,
  ServerConfig,
} from '../types';
import { Logger } from '../utils/logger';

type EventCallback = (...args: any[]) => void;

export class MCPServer {
  private events: Map<string, EventCallback[]> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();
  private logger: Logger;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
    this.setupDefaultHandlers();
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 触发事件
   */
  public emit(event: string, ...args: any[]): boolean {
    const callbacks = this.events.get(event);
    if (!callbacks || callbacks.length === 0) {
      return false;
    }
    callbacks.forEach(callback => callback(...args));
    return true;
  }

  /**
   * 获取事件监听器数量
   */
  public listenerCount(event: string): number {
    const callbacks = this.events.get(event);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * 移除所有事件监听器
   */
  public removeAllListeners(): void {
    this.events.clear();
  }

  /**
   * 设置默认的协议处理器
   */
  private setupDefaultHandlers(): void {
    this.on('initialize', this.handleInitialize.bind(this));
    this.on('tools/list', this.handleToolsList.bind(this));
    this.on('tools/call', this.handleToolsCall.bind(this));
    this.on('resources/list', this.handleResourcesList.bind(this));
    this.on('resources/read', this.handleResourcesRead.bind(this));
    this.on('prompts/list', this.handlePromptsList.bind(this));
    this.on('prompts/get', this.handlePromptsGet.bind(this));
  }

  /**
   * 处理 MCP 请求
   */
  public async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      this.logger.debug(`收到请求: ${request.method}`, { id: request.id, params: request.params });

      // 验证请求格式
      if (!this.isValidRequest(request)) {
        return this.createErrorResponse(request.id, MCP_ERROR_CODES.INVALID_REQUEST, '无效的请求格式');
      }

      // 检查方法是否存在
      if (!this.listenerCount(request.method)) {
        return this.createErrorResponse(request.id, MCP_ERROR_CODES.METHOD_NOT_FOUND, `方法 ${request.method} 未找到`);
      }

      // 执行方法处理
      const result = await this.executeMethod(request.method, request.params || {});
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };
    } catch (error) {
      this.logger.error('处理请求时发生错误', { error, request });
      return this.createErrorResponse(
        request.id,
        MCP_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : '内部服务器错误'
      );
    }
  }

  /**
   * 验证请求格式
   */
  private isValidRequest(request: MCPRequest): boolean {
    return (
      request.jsonrpc === '2.0' &&
      typeof request.method === 'string' &&
      (typeof request.id === 'string' || typeof request.id === 'number')
    );
  }

  /**
   * 执行方法
   */
  private async executeMethod(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`方法 ${method} 执行超时`));
      }, this.config.timeout);

      this.emit(method, params, (error: Error | null, result?: unknown) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data,
      },
    };
  }

  /**
   * 注册工具
   */
  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.logger.info(`注册工具: ${tool.name}`);
  }

  /**
   * 注册资源
   */
  public registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    this.logger.info(`注册资源: ${resource.name}`);
  }

  /**
   * 注册提示符
   */
  public registerPrompt(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
    this.logger.info(`注册提示符: ${prompt.name}`);
  }

  /**
   * 处理初始化请求
   */
  private async handleInitialize(
    _params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {},
        },
        serverInfo: {
          name: this.config.name,
          version: this.config.version,
        },
      };
      
      this.logger.info('MCP 服务器初始化完成');
      callback(null, result);
    } catch (error) {
      callback(error instanceof Error ? error : new Error('初始化失败'));
    }
  }

  /**
   * 处理工具列表请求
   */
  private async handleToolsList(
    _params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const tools = Array.from(this.tools.values());
      callback(null, { tools });
    } catch (error) {
      callback(error instanceof Error ? error : new Error('获取工具列表失败'));
    }
  }

  /**
   * 处理工具调用请求
   */
  private async handleToolsCall(
    params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
      
      if (!this.tools.has(name)) {
        throw new Error(`工具 ${name} 不存在`);
      }

      // 触发工具执行事件
      this.emit(`tool:${name}`, args, callback);
    } catch (error) {
      callback(error instanceof Error ? error : new Error('工具调用失败'));
    }
  }

  /**
   * 处理资源列表请求
   */
  private async handleResourcesList(
    _params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const resources = Array.from(this.resources.values());
      callback(null, { resources });
    } catch (error) {
      callback(error instanceof Error ? error : new Error('获取资源列表失败'));
    }
  }

  /**
   * 处理资源读取请求
   */
  private async handleResourcesRead(
    params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const { uri } = params as { uri: string };
      
      if (!this.resources.has(uri)) {
        throw new Error(`资源 ${uri} 不存在`);
      }

      // 触发资源读取事件
      this.emit(`resource:${uri}`, params, callback);
    } catch (error) {
      callback(error instanceof Error ? error : new Error('资源读取失败'));
    }
  }

  /**
   * 处理提示符列表请求
   */
  private async handlePromptsList(
    _params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const prompts = Array.from(this.prompts.values());
      callback(null, { prompts });
    } catch (error) {
      callback(error instanceof Error ? error : new Error('获取提示符列表失败'));
    }
  }

  /**
   * 处理提示符获取请求
   */
  private async handlePromptsGet(
    params: Record<string, unknown>,
    callback: (error: Error | null, result?: unknown) => void
  ): Promise<void> {
    try {
      const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };
      
      if (!this.prompts.has(name)) {
        throw new Error(`提示符 ${name} 不存在`);
      }

      // 触发提示符获取事件
      this.emit(`prompt:${name}`, { name, args: args || {} }, callback);
    } catch (error) {
      callback(error instanceof Error ? error : new Error('获取提示符失败'));
    }
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    this.logger.info(`MCP 服务器启动: ${this.config.name} v${this.config.version}`);
    this.emit('server:started');
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    this.logger.info('MCP 服务器停止');
    this.emit('server:stopped');
    this.removeAllListeners();
  }
}