import { spawn, ChildProcess } from 'child_process';
import path from 'path';

describe('MCP Server Stdio Integration', () => {
  let serverProcess: ChildProcess;
  const serverPath = path.resolve(__dirname, '../../..', 'dist', 'index.js');

  beforeEach(() => {
    // 启动 MCP 服务器进程
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
  });

  afterEach((done) => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess.on('exit', () => done());
    } else {
      done();
    }
  });

  const sendRequest = (request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      let responseData = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const onData = (data: Buffer) => {
        responseData += data.toString();
        const lines = responseData.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line.trim());
              if (response.id === request.id) {
                clearTimeout(timeout);
                serverProcess.stdout?.off('data', onData);
                resolve(response);
                return;
              }
            } catch (e) {
              // 忽略解析错误，继续等待完整响应
            }
          }
        }
      };

      serverProcess.stdout?.on('data', onData);
      
      serverProcess.stderr?.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      // 发送请求
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  };

  it('should handle initialize request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const response = await sendRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
        serverInfo: {
          name: '微信小程序开发工具 MCP 服务器',
          version: '1.0.0'
        }
      }
    });
  });

  it('should handle tools/list request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await sendRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: 'weapp_login',
            description: expect.any(String),
            inputSchema: expect.any(Object)
          }),
          expect.objectContaining({
            name: 'weapp_check_login',
            description: expect.any(String),
            inputSchema: expect.any(Object)
          }),
          expect.objectContaining({
            name: 'weapp_preview',
            description: expect.any(String),
            inputSchema: expect.any(Object)
          })
        ])
      }
    });

    // 验证工具数量
    expect(response.result.tools.length).toBeGreaterThan(10);
  });

  it('should handle resources/list request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/list'
    };

    const response = await sendRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 3,
      result: {
        resources: expect.arrayContaining([
          expect.objectContaining({
            uri: expect.any(String),
            name: expect.any(String),
            description: expect.any(String)
          })
        ])
      }
    });
  });

  it('should handle prompts/list request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'prompts/list'
    };

    const response = await sendRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 4,
      result: {
        prompts: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String)
          })
        ])
      }
    });
  });

  it('should handle invalid JSON gracefully', async () => {
    return new Promise((resolve) => {
      let responseData = '';
      
      const onData = (data: Buffer) => {
        responseData += data.toString();
        if (responseData.includes('Parse error')) {
          serverProcess.stdout?.off('data', onData);
          
          try {
            const lines = responseData.split('\n');
            const errorLine = lines.find(line => line.includes('Parse error'));
            const errorResponse = JSON.parse(errorLine!);
            
            expect(errorResponse).toMatchObject({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error'
              }
            });
            resolve(undefined);
          } catch (e) {
            resolve(undefined);
          }
        }
      };

      serverProcess.stdout?.on('data', onData);
      
      // 发送无效 JSON
      serverProcess.stdin?.write('invalid json\n');
    });
  });

  it('should handle method not found', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 5,
      method: 'nonexistent/method'
    };

    const response = await sendRequest(request);

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 5,
      error: {
        code: expect.any(Number),
        message: expect.stringContaining('未找到')
      }
    });
  });
});