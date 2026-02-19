/**
 * MCP 服务器实现
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allTools, toolNames } from './tools/index.js';
import { cliClient } from './cli-client.js';
import { configManager } from './config.js';
import { logger } from './utils/logger.js';
import { ToolResult, ResourceDefinition, PromptDefinition } from './types.js';

/**
 * 资源定义
 */
const resources: ResourceDefinition[] = [
  {
    uri: 'weapp://cli/status',
    name: 'CLI 状态',
    description: 'CLI 工具状态和配置信息',
    mimeType: 'application/json',
  },
  {
    uri: 'weapp://config/current',
    name: '当前配置',
    description: '当前 MCP 服务器的配置信息',
    mimeType: 'application/json',
  },
];

/**
 * 提示符定义
 */
const prompts: PromptDefinition[] = [
  {
    name: 'weapp_setup_guide',
    description: '小程序开发环境设置指南',
    arguments: [
      { name: 'projectPath', description: '项目路径', required: true },
    ],
  },
  {
    name: 'weapp_deploy_checklist',
    description: '小程序发布检查清单',
    arguments: [
      { name: 'version', description: '版本号', required: true },
      { name: 'desc', description: '版本描述', required: false },
    ],
  },
];

/**
 * MCP 服务器类
 */
export class WeappMCPServer {
  private server: Server;
  private isRunning = false;

  constructor() {
    this.server = new Server(
      {
        name: 'weapp-devtools-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandler();
  }

  /**
   * 设置请求处理器
   */
  private setupHandlers(): void {
    // 工具列表
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: allTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // 工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info(`调用工具: ${name}`);
      logger.debug('参数:', JSON.stringify(args));

      const tool = allTools.find((t) => t.name === name);
      if (!tool) {
        return this.createErrorResult(`未知工具: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});
        return result;
      } catch (error) {
        logger.error(`工具执行失败: ${name}`, error);
        return this.createErrorResult(
          `执行失败: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // 资源列表
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources };
    });

    // 读取资源
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const content = await this.readResource(uri);

      if (content === null) {
        throw new Error(`资源不存在: ${uri}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: this.getMimeType(uri),
            text: content,
          },
        ],
      };
    });

    // 提示符列表
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts };
    });

    // 获取提示符
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const prompt = prompts.find((p) => p.name === name);

      if (!prompt) {
        throw new Error(`提示符不存在: ${name}`);
      }

      const messages = this.getPromptMessages(name, args || {});

      return {
        description: prompt.description,
        messages,
      };
    });
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandler(): void {
    this.server.onerror = (error) => {
      logger.error('MCP 服务器错误:', error);
    };
  }

  /**
   * 读取资源内容
   */
  private async readResource(uri: string): Promise<string | null> {
    switch (uri) {
      case 'weapp://cli/status':
        return JSON.stringify(
          {
            cliPath: cliClient.getCliPath(),
            initialized: !!cliClient.getCliPath(),
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );

      case 'weapp://config/current':
        const config = configManager.getConfig();
        return JSON.stringify(
          {
            ...config,
            cliPath: config.cliPath || '未设置（将自动检测）',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        );

      default:
        return null;
    }
  }

  /**
   * 获取资源的 MIME 类型
   */
  private getMimeType(uri: string): string {
    const resource = resources.find((r) => r.uri === uri);
    return resource?.mimeType || 'text/plain';
  }

  /**
   * 获取提示符消息
   */
  private getPromptMessages(
    name: string,
    args: Record<string, any>
  ): Array<{ role: 'user'; content: { type: 'text'; text: string } }> {
    switch (name) {
      case 'weapp_setup_guide':
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `请帮我设置小程序开发环境。项目路径是: ${args.projectPath}

请按照以下步骤进行：
1. 检查项目路径是否有效
2. 打开微信开发者工具
3. 检查登录状态
4. 如果需要，执行登录

请使用相应的工具完成这些操作。`,
            },
          },
        ];

      case 'weapp_deploy_checklist':
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `我准备发布小程序版本 ${args.version}${args.desc ? `，描述: ${args.desc}` : ''}。

请帮我完成以下检查：
1. 检查是否已登录
2. 构建 npm（如果需要）
3. 生成预览二维码验证
4. 上传代码

请使用相应的工具完成这些操作。`,
            },
          },
        ];

      default:
        return [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `提示符: ${name}`,
            },
          },
        ];
    }
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(message: string): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: {
                message,
                timestamp: new Date().toISOString(),
              },
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('服务器已经在运行');
      return;
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.isRunning = true;
    logger.info('MCP 服务器已启动');
    logger.info(`已注册 ${allTools.length} 个工具: ${toolNames.join(', ')}`);
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    await this.server.close();
    this.isRunning = false;
    logger.info('MCP 服务器已停止');
  }
}
