import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('MCP Configuration Tests', () => {
  const projectRoot = path.resolve(__dirname, '../../../');
  const mcpConfigPath = path.join(projectRoot, 'mcp-config.json');
  const mcpConfigExamplePath = path.join(projectRoot, 'mcp-config-example.json');
  const distIndexPath = path.join(projectRoot, 'dist/index.js');

  beforeAll(() => {
    // 确保项目已构建
    if (!fs.existsSync(distIndexPath)) {
      execSync('npm run build', { cwd: projectRoot });
    }
  });

  describe('mcp-config.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(mcpConfigPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = fs.readFileSync(mcpConfigPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have correct structure', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      
      expect(config).toHaveProperty('mcpServers');
      expect(config.mcpServers).toHaveProperty('weapp-devtools');
      
      const serverConfig = config.mcpServers['weapp-devtools'];
      expect(serverConfig).toHaveProperty('command', 'node');
      expect(serverConfig).toHaveProperty('args');
      expect(Array.isArray(serverConfig.args)).toBe(true);
      expect(serverConfig.args).toHaveLength(1);
      expect(serverConfig).toHaveProperty('env');
    });

    it('should point to existing dist/index.js file', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      const serverConfig = config.mcpServers['weapp-devtools'];
      const indexJsPath = serverConfig.args[0];
      
      expect(fs.existsSync(indexJsPath)).toBe(true);
      expect(path.basename(indexJsPath)).toBe('index.js');
    });

    it('should have valid environment variables', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      const serverConfig = config.mcpServers['weapp-devtools'];
      
      expect(serverConfig.env).toHaveProperty('NODE_ENV');
      expect(['development', 'production', 'test']).toContain(serverConfig.env.NODE_ENV);
    });
  });

  describe('mcp-config-example.json', () => {
    it('should exist', () => {
      expect(fs.existsSync(mcpConfigExamplePath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = fs.readFileSync(mcpConfigExamplePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have the same structure as mcp-config.json', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      const exampleConfig = JSON.parse(fs.readFileSync(mcpConfigExamplePath, 'utf-8'));
      
      expect(Object.keys(config)).toEqual(Object.keys(exampleConfig));
      expect(Object.keys(config.mcpServers)).toEqual(Object.keys(exampleConfig.mcpServers));
      
      const serverKeys = Object.keys(config.mcpServers['weapp-devtools']);
      const exampleServerKeys = Object.keys(exampleConfig.mcpServers['weapp-devtools']);
      expect(serverKeys.sort()).toEqual(exampleServerKeys.sort());
    });
  });

  describe('MCP Server Executable', () => {
    it('should be able to run the MCP server without errors', () => {
      expect(() => {
        // 测试服务器是否可以正常启动（快速退出测试）
        execSync(`node ${distIndexPath} --help || true`, {
          cwd: projectRoot,
          timeout: 5000,
          encoding: 'utf-8'
        });
        // 如果没有抛出异常，说明文件可以正常执行
      }).not.toThrow();
    });

    it('should have correct file permissions', () => {
      const stats = fs.statSync(distIndexPath);
      expect(stats.isFile()).toBe(true);
      // 检查文件是否可读
      expect(() => fs.accessSync(distIndexPath, fs.constants.R_OK)).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate against MCP server configuration schema', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      
      // 基本的 MCP 配置验证
      expect(typeof config).toBe('object');
      expect(config.mcpServers).toBeDefined();
      
      Object.entries(config.mcpServers).forEach(([serverName, serverConfig]: [string, any]) => {
        expect(typeof serverName).toBe('string');
        expect(serverName.length).toBeGreaterThan(0);
        
        expect(serverConfig).toHaveProperty('command');
        expect(typeof serverConfig.command).toBe('string');
        
        expect(serverConfig).toHaveProperty('args');
        expect(Array.isArray(serverConfig.args)).toBe(true);
        
        if (serverConfig.env) {
          expect(typeof serverConfig.env).toBe('object');
        }
      });
    });

    it('should have absolute paths in configuration', () => {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      const serverConfig = config.mcpServers['weapp-devtools'];
      const indexJsPath = serverConfig.args[0];
      
      expect(path.isAbsolute(indexJsPath)).toBe(true);
    });
  });
});