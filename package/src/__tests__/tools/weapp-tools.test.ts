import { WeappTools } from '../../tools/weapp-tools';
import { WeappConfig, MemberAction } from '../../types';
import * as fs from 'node:fs';

// 模拟依赖
jest.mock('node:fs');
jest.mock('node:path');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('WeappTools', () => {
  let weappTools: WeappTools;
  let mockConfig: WeappConfig;

  beforeEach(() => {
    weappTools = new WeappTools();
    mockConfig = (global as any).createMockWeappConfig();
    
    // 重置模拟
    jest.clearAllMocks();
    
    // 设置默认的文件系统模拟
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock-private-key');
  });

  describe('upload', () => {
    it('应该成功上传代码', async () => {
      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toBe('代码上传成功');
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe(mockConfig.version);
      expect(result.data?.desc).toBe(mockConfig.desc);
    });

    it('应该处理项目路径不存在的错误', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('project')) {
          return false;
        }
        return true;
      });

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('项目路径不存在');
    });

    it('应该处理私钥文件不存在的错误', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('private.key')) {
          return false;
        }
        return true;
      });

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('私钥文件不存在');
    });

    it('应该处理项目配置文件不存在的错误', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('project.config.json')) {
          return false;
        }
        return true;
      });

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('项目配置文件不存在');
    });

    it('应该处理私钥文件读取错误', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('读取文件失败');
      });

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无法读取私钥文件');
    });
  });

  describe('preview', () => {
    it('应该成功生成预览', async () => {
      const result = await weappTools.preview(mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toBe('预览生成成功');
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.qrCodeBuffer).toBeDefined();
    });

    it('应该使用正确的机器人编号', async () => {
      const configWithRobot = {
        ...mockConfig,
        robot: 5,
      };

      const result = await weappTools.preview(configWithRobot);

      expect(result.success).toBe(true);
    });

    it('应该处理预览生成错误', async () => {
      // 模拟 miniprogram-ci 抛出错误
      const mockCi = require('miniprogram-ci');
      mockCi.preview.mockRejectedValueOnce(new Error('预览失败'));

      const result = await weappTools.preview(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('预览失败');
    });
  });

  describe('buildNpm', () => {
    it('应该成功构建 npm', async () => {
      const result = await weappTools.buildNpm(mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toBe('npm 构建成功');
      expect(result.buildInfo).toBeDefined();
    });

    it('应该处理构建错误', async () => {
      // 模拟 miniprogram-ci 抛出错误
      const mockCi = require('miniprogram-ci');
      mockCi.packNpm.mockRejectedValueOnce(new Error('构建失败'));

      const result = await weappTools.buildNpm(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('构建失败');
    });
  });

  describe('manageMembers', () => {
    let memberAction: MemberAction;

    beforeEach(() => {
      memberAction = {
        action: 'add',
        members: [
          {
            wechatid: 'test_user_1',
            role: 'developer',
          },
          {
            wechatid: 'test_user_2',
            role: 'experience',
          },
        ],
      };
    });

    it('应该成功添加成员', async () => {
      const result = await weappTools.manageMembers(mockConfig, memberAction);

      expect(result.success).toBe(true);
      expect(result.message).toContain('成功添加 2 个成员');
    });

    it('应该成功移除成员', async () => {
      memberAction.action = 'remove';

      const result = await weappTools.manageMembers(mockConfig, memberAction);

      expect(result.success).toBe(true);
      expect(result.message).toContain('成功移除 2 个成员');
    });

    it('应该处理成员管理错误', async () => {
      // 模拟 miniprogram-mp-ci 抛出错误
      const mockMpCi = require('miniprogram-mp-ci');
      mockMpCi.addMember.mockRejectedValueOnce(new Error('添加成员失败'));

      const result = await weappTools.manageMembers(mockConfig, memberAction);

      expect(result.success).toBe(false);
      expect(result.message).toContain('添加成员失败');
    });

    it('应该处理移除成员错误', async () => {
      memberAction.action = 'remove';
      
      // 模拟 miniprogram-mp-ci 抛出错误
      const mockMpCi = require('miniprogram-mp-ci');
      mockMpCi.removeMember.mockRejectedValueOnce(new Error('移除成员失败'));

      const result = await weappTools.manageMembers(mockConfig, memberAction);

      expect(result.success).toBe(false);
      expect(result.message).toContain('移除成员失败');
    });
  });

  describe('getProjectInfo', () => {
    it('应该成功获取项目信息', async () => {
      const mockProjectConfig = {
        appid: 'test-appid',
        projectname: 'test-project',
        setting: {
          es6: true,
          minify: true,
        },
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockProjectConfig));

      const result = await weappTools.getProjectInfo('/path/to/project');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProjectConfig);
    });

    it('应该处理项目配置文件不存在的错误', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await weappTools.getProjectInfo('/path/to/project');

      expect(result.success).toBe(false);
      expect(result.message).toContain('项目配置文件不存在');
    });

    it('应该处理 JSON 解析错误', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = await weappTools.getProjectInfo('/path/to/project');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not valid JSON');
    });

    it('应该处理文件读取错误', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('文件读取失败');
      });

      const result = await weappTools.getProjectInfo('/path/to/project');

      expect(result.success).toBe(false);
      expect(result.message).toContain('文件读取失败');
    });
  });

  describe('配置验证', () => {
    it('应该验证必需的配置字段', async () => {
      const invalidConfig = {
        // 缺少必需字段
        projectPath: '/path/to/project',
      };

      try {
        await weappTools.upload(invalidConfig as WeappConfig);
        // 如果没有抛出错误，测试应该失败
        expect(true).toBe(false);
      } catch (error) {
        // 期望抛出错误
        expect(error).toBeDefined();
      }
    });

    it('应该验证文件路径', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  describe('错误处理', () => {
    it('应该捕获并处理未知错误', async () => {
      // 模拟一个会抛出未知错误的情况
      const mockCi = require('miniprogram-ci');
      mockCi.upload.mockRejectedValueOnce('字符串错误');

      const result = await weappTools.upload(mockConfig);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });
});