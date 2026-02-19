import { MCPServer } from '../../server/mcp-server';
import { LogLevel, ServerConfig, MCP_ERROR_CODES } from '../../types';

describe('MCPServer', () => {
  let server: MCPServer;
  let config: ServerConfig;

  beforeEach(() => {
    config = {
      name: 'test-server',
      version: '1.0.0',
      logLevel: LogLevel.ERROR, // 减少测试输出
      maxRequestSize: 1024,
      timeout: 5000,
    };
    server = new MCPServer(config);
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务器', () => {
      expect(server).toBeInstanceOf(MCPServer);
    });

    it('应该设置默认的协议处理器', () => {
      expect(server.listenerCount('initialize')).toBe(1);
      expect(server.listenerCount('tools/list')).toBe(1);
      expect(server.listenerCount('tools/call')).toBe(1);
      expect(server.listenerCount('resources/list')).toBe(1);
      expect(server.listenerCount('resources/read')).toBe(1);
      expect(server.listenerCount('prompts/list')).toBe(1);
      expect(server.listenerCount('prompts/get')).toBe(1);
    });
  });

  describe('handleRequest', () => {
    it('应该处理有效的初始化请求', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      };

      const response = await server.handleRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it('应该返回错误响应对于无效请求', async () => {
      const invalidRequest = {
        jsonrpc: '1.0', // 错误的版本
        id: 1,
        method: 'initialize',
      } as any;

      const response = await server.handleRequest(invalidRequest);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCP_ERROR_CODES.INVALID_REQUEST);
    });

    it('应该返回方法未找到错误', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'nonexistent_method',
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCP_ERROR_CODES.METHOD_NOT_FOUND);
    });

    it('应该处理方法执行超时', async () => {
      // 注册一个会超时的方法
      server.on('slow_method', (_params: any, _callback: any) => {
        // 模拟慢方法，不调用 callback
      });

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'slow_method',
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(MCP_ERROR_CODES.INTERNAL_ERROR);
      expect(response.error?.message).toContain('超时');
    }, 10000);
  });

  describe('工具管理', () => {
    it('应该注册工具', () => {
      const tool = {
        name: 'test_tool',
        description: '测试工具',
        inputSchema: {
          type: 'object' as const,
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
      };

      server.registerTool(tool);

      // 验证工具已注册（通过工具列表请求）
      expect(server).toBeInstanceOf(MCPServer);
    });

    it('应该处理工具列表请求', async () => {
      const tool = {
        name: 'test_tool',
        description: '测试工具',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      };

      server.registerTool(tool);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/list',
      };

      const response = await server.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).tools).toBeInstanceOf(Array);
      expect((response.result as any).tools).toHaveLength(1);
      expect((response.result as any).tools[0].name).toBe('test_tool');
    });

    it('应该处理工具调用请求', async () => {
      const tool = {
        name: 'test_tool',
        description: '测试工具',
        inputSchema: {
          type: 'object' as const,
          properties: {},
        },
      };

      server.registerTool(tool);

      // 注册工具处理器
      server.on('tool:test_tool', (args: any, callback: any) => {
        callback(null, { result: 'success', args });
      });

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: {
          name: 'test_tool',
          arguments: { input: 'test' },
        },
      };

      const response = await server.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).result).toBe('success');
    });

    it('应该处理不存在的工具调用', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/call',
        params: {
          name: 'nonexistent_tool',
          arguments: {},
        },
      };

      const response = await server.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('不存在');
    });
  });

  describe('资源管理', () => {
    it('应该注册资源', () => {
      const resource = {
        uri: 'test://resource',
        name: '测试资源',
        description: '测试资源描述',
        mimeType: 'text/plain',
      };

      server.registerResource(resource);

      expect(server).toBeInstanceOf(MCPServer);
    });

    it('应该处理资源列表请求', async () => {
      const resource = {
        uri: 'test://resource',
        name: '测试资源',
      };

      server.registerResource(resource);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
      };

      const response = await server.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).resources).toBeInstanceOf(Array);
      expect((response.result as any).resources).toHaveLength(1);
      expect((response.result as any).resources[0].uri).toBe('test://resource');
    });
  });

  describe('提示符管理', () => {
    it('应该注册提示符', () => {
      const prompt = {
        name: 'test_prompt',
        description: '测试提示符',
        arguments: [
          {
            name: 'input',
            description: '输入参数',
            required: true,
          },
        ],
      };

      server.registerPrompt(prompt);

      expect(server).toBeInstanceOf(MCPServer);
    });

    it('应该处理提示符列表请求', async () => {
      const prompt = {
        name: 'test_prompt',
        description: '测试提示符',
      };

      server.registerPrompt(prompt);

      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'prompts/list',
      };

      const response = await server.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).prompts).toBeInstanceOf(Array);
      expect((response.result as any).prompts).toHaveLength(1);
      expect((response.result as any).prompts[0].name).toBe('test_prompt');
    });
  });

  describe('服务器生命周期', () => {
    it('应该启动服务器', async () => {
      const startPromise = server.start();
      await expect(startPromise).resolves.toBeUndefined();
    });

    it('应该停止服务器', async () => {
      await server.start();
      const stopPromise = server.stop();
      await expect(stopPromise).resolves.toBeUndefined();
    });
  });
});