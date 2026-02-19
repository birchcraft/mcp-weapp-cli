import WeappMCPClient from '../index';
import { LogLevel } from '../types';

describe('WeappMCPClient', () => {
  let client: WeappMCPClient;

  beforeEach(() => {
    client = new WeappMCPClient({
      logLevel: LogLevel.ERROR, // 减少测试输出
    });
  });

  afterEach(async () => {
    await client.stop();
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建客户端', () => {
      const defaultClient = new WeappMCPClient();
      expect(defaultClient).toBeInstanceOf(WeappMCPClient);
    });

    it('应该使用自定义配置创建客户端', () => {
      const customClient = new WeappMCPClient({
        name: 'custom-client',
        version: '2.0.0',
        logLevel: LogLevel.DEBUG,
        timeout: 60000,
      });
      expect(customClient).toBeInstanceOf(WeappMCPClient);
    });
  });

  describe('生命周期管理', () => {
    it('应该成功启动客户端', async () => {
      await expect(client.start()).resolves.toBeUndefined();
    });

    it('应该成功停止客户端', async () => {
      await client.start();
      await expect(client.stop()).resolves.toBeUndefined();
    });
  });

  describe('MCP 协议处理', () => {
    beforeEach(async () => {
      await client.start();
    });

    it('应该处理初始化请求', async () => {
      const request = (global as any).createMockMCPRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      });

      const response = await client.handleRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(request.id);
      expect(response.result).toBeDefined();
      expect((response.result as any).serverInfo).toBeDefined();
      expect((response.result as any).capabilities).toBeDefined();
    });

    it('应该处理工具列表请求', async () => {
      const request = (global as any).createMockMCPRequest('tools/list');

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).tools).toBeInstanceOf(Array);
      
      const tools = (response.result as any).tools;
      const toolNames = tools.map((tool: any) => tool.name);
      
      expect(toolNames).toContain('weapp_upload');
      expect(toolNames).toContain('weapp_preview');
      expect(toolNames).toContain('weapp_build_npm');
      expect(toolNames).toContain('weapp_manage_members');
      expect(toolNames).toContain('weapp_get_project_info');
    });

    it('应该处理资源列表请求', async () => {
      const request = (global as any).createMockMCPRequest('resources/list');

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).resources).toBeInstanceOf(Array);
      
      const resources = (response.result as any).resources;
      expect(resources.length).toBeGreaterThan(0);
    });

    it('应该处理提示符列表请求', async () => {
      const request = (global as any).createMockMCPRequest('prompts/list');

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).prompts).toBeInstanceOf(Array);
      
      const prompts = (response.result as any).prompts;
      const promptNames = prompts.map((prompt: any) => prompt.name);
      
      expect(promptNames).toContain('weapp_deploy_guide');
      expect(promptNames).toContain('weapp_troubleshooting');
    });
  });

  describe('工具调用', () => {
    beforeEach(async () => {
      await client.start();
    });

    it('应该处理上传工具调用', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_upload',
        arguments: {
          appid: 'test-appid',
          privateKeyPath: '/path/to/private.key',
          projectPath: '/path/to/project',
          version: '1.0.0',
          desc: '测试上传',
        },
      });

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      expect((response.result as any).content).toBeInstanceOf(Array);
      expect((response.result as any).content[0].type).toBe('text');
      
      const result = JSON.parse((response.result as any).content[0].text);
      expect(result.success).toBe(true);
    });

    it('应该处理预览工具调用', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_preview',
        arguments: {
          appid: 'test-appid',
          privateKeyPath: '/path/to/private.key',
          projectPath: '/path/to/project',
          robot: 1,
        },
      });

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      const result = JSON.parse((response.result as any).content[0].text);
      expect(result.success).toBe(true);
    });

    it('应该处理构建 npm 工具调用', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_build_npm',
        arguments: {
          appid: 'test-appid',
          privateKeyPath: '/path/to/private.key',
          projectPath: '/path/to/project',
        },
      });

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      const result = JSON.parse((response.result as any).content[0].text);
      expect(result.success).toBe(true);
    });

    it('应该处理成员管理工具调用', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_manage_members',
        arguments: {
          appid: 'test-appid',
          privateKeyPath: '/path/to/private.key',
          action: 'add',
          members: [
            {
              wechatid: 'test_user',
              role: 'developer',
            },
          ],
        },
      });

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      const result = JSON.parse((response.result as any).content[0].text);
      expect(result.success).toBe(true);
    });

    it('应该处理获取项目信息工具调用', async () => {
      // 模拟 project.config.json 文件存在
      const fs = require('node:fs');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        appid: 'test-appid',
        projectname: 'test-project',
        setting: {
          es6: true,
          minify: true
        }
      }));

      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_get_project_info',
        arguments: {
          projectPath: '/path/to/project',
        },
      });

      const response = await client.handleRequest(request);

      expect(response.result).toBeDefined();
      const result = JSON.parse((response.result as any).content[0].text);
      expect(result.success).toBe(true);
    });

    it('应该处理无效的工具参数', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'weapp_upload',
        arguments: {
          // 缺少必需的参数
          appid: 'test-appid',
          // privateKeyPath 和 projectPath 缺失
        },
      });

      const response = await client.handleRequest(request);

      expect(response.error).toBeDefined();
    });

    it('应该处理不存在的工具调用', async () => {
      const request = (global as any).createMockMCPRequest('tools/call', {
        name: 'nonexistent_tool',
        arguments: {},
      });

      const response = await client.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('不存在');
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await client.start();
    });

    it('应该处理无效的 JSON-RPC 请求', async () => {
      const invalidRequest = {
        jsonrpc: '1.0', // 错误的版本
        id: 1,
        method: 'test',
      } as any;

      const response = await client.handleRequest(invalidRequest);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32600); // INVALID_REQUEST
    });

    it('应该处理不存在的方法', async () => {
      const request = (global as any).createMockMCPRequest('nonexistent_method');

      const response = await client.handleRequest(request);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601); // METHOD_NOT_FOUND
    });
  });

  describe('服务器访问', () => {
    it('应该能够获取服务器实例', () => {
      const server = client.getServer();
      expect(server).toBeDefined();
    });
  });
});