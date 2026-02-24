/**
 * 构建相关工具
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition, CacheType } from '../types.js';
import { createTool } from '../utils/tool-wrapper.js';
import { text, success } from '../utils/result-formatter.js';

const cacheTypeMap: Record<CacheType, string> = {
  storage: '数据缓存',
  file: '文件缓存',
  compile: '编译缓存',
  auth: '登录授权缓存',
  network: '网络缓存',
  session: '会话缓存',
  all: '全部缓存',
};

/**
 * 构建 npm 工具
 */
const weappBuildNpm = createTool<{
  project?: string;
  projectPath?: string;
  compileType?: 'miniprogram' | 'plugin';
}>('weapp_build_npm', '构建 npm 包，将 node_modules 中的依赖构建为小程序可用的模块')
  .stringParam('project', '小程序项目目录的绝对路径（与 projectPath 二选一）')
  .stringParam('projectPath', '小程序项目目录的绝对路径（与 project 二选一，推荐使用 project）')
  .stringParam('compileType', '编译类型：miniprogram（普通小程序）或 plugin（插件）。默认为 miniprogram', {
    enum: ['miniprogram', 'plugin'],
  })
  .wrapHandler({
    operation: '构建 npm',
    executor: async (args) => {
      const projectPath = args.project || args.projectPath;
      return cliClient.buildNpm(projectPath!, args.compileType);
    },
    validator: (args) => {
      const projectPath = args.project || args.projectPath;
      if (!projectPath) {
        return {
          valid: false,
          error: text(
            '错误: project 或 projectPath 是必需参数，必须提供小程序项目的绝对路径',
            true
          ),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 清除缓存工具
 */
const weappClearCache = createTool<{ clean?: CacheType }>(
  'weapp_clear_cache',
  '清除微信开发者工具的缓存数据'
)
  .stringParam('clean', '要清除的缓存类型', {
    enum: ['storage', 'file', 'compile', 'auth', 'network', 'session', 'all'],
    default: 'all',
  })
  .setHandler(async (args) => {
    const clean = args.clean || 'all';
    const validCacheTypes: CacheType[] = ['storage', 'file', 'compile', 'auth', 'network', 'session', 'all'];

    if (!validCacheTypes.includes(clean)) {
      return text(`错误: clean 必须是以下值之一: ${validCacheTypes.join(', ')}`, true);
    }

    try {
      const result = await cliClient.clearCache(clean);

      if (result.success) {
        return success('缓存清除成功', {
          清除类型: `${cacheTypeMap[clean]} (${clean})`,
        });
      } else {
        return text(
          `缓存清除失败 (退出码: ${result.code})\n\n${result.stderr || result.stdout || '未知错误'}`,
          true
        );
      }
    } catch (error) {
      return text(`执行失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 构建工具数组
 */
export const buildTools: ToolDefinition[] = [weappBuildNpm, weappClearCache];
