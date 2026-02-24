/**
 * HTTP API 工具模块
 * 提供通过微信开发者工具 HTTP 服务接口执行操作的能力
 */
import { httpClient } from '../http-client.js';
import { ToolDefinition, CacheType } from '../types.js';
import { isValidProjectPath } from '../utils/helpers.js';
import { createTool } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * HTTP 登录
 */
const weappHttpLogin = createTool<{
  qrFormat?: 'image' | 'base64' | 'terminal';
  qrOutput?: string;
  resultOutput?: string;
}>('weapp_http_login', '使用 HTTP API 登录微信开发者工具')
  .stringParam('qrFormat', '二维码格式', { enum: ['image', 'base64', 'terminal'] })
  .stringParam('qrOutput', '二维码输出路径')
  .stringParam('resultOutput', '登录结果输出路径')
  .setHandler(async (args) => {
    const outputLines: string[] = ['🔐 HTTP 方式登录'];

    try {
      const result = await httpClient.login({
        qrFormat: args.qrFormat,
        qrOutput: args.qrOutput,
        resultOutput: args.resultOutput,
      });

      if (result.success) {
        outputLines.push('\n✅ 登录请求已发送！');
      } else {
        outputLines.push(`\n❌ 登录请求失败`);
        if (result.error) {
          outputLines.push(`   错误: ${result.error}`);
        }
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 登录失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 检查登录状态
 */
const weappHttpCheckLogin = createTool(
  'weapp_http_check_login',
  '使用 HTTP API 检查微信开发者工具登录状态'
)
  .setHandler(async () => {
    try {
      const result = await httpClient.checkLogin();

      const outputLines: string[] = ['👤 HTTP 方式检查登录状态', ''];

      if (result.success) {
        outputLines.push('✅ HTTP 服务正常响应');
      } else {
        outputLines.push('⚠️ HTTP 服务响应异常');
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 检查失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 预览
 */
const weappHttpPreview = createTool<{
  project: string;
  qrFormat?: 'image' | 'base64' | 'terminal';
  qrOutput?: string;
  infoOutput?: string;
  compileCondition?: string;
}>('weapp_http_preview', '使用 HTTP API 生成小程序预览二维码')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('qrFormat', '二维码格式', { enum: ['image', 'base64', 'terminal'] })
  .stringParam('qrOutput', '二维码输出路径')
  .stringParam('infoOutput', '预览信息输出路径')
  .stringParam('compileCondition', '自定义编译条件（JSON 字符串）')
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['👁️ HTTP 方式预览'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await httpClient.preview(args.project, {
        qrFormat: args.qrFormat,
        qrOutput: args.qrOutput,
        infoOutput: args.infoOutput,
        compileCondition: args.compileCondition,
      });

      if (result.success) {
        outputLines.push('\n✅ 预览请求成功！');
      } else {
        outputLines.push(`\n❌ 预览请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 预览失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 上传
 */
const weappHttpUpload = createTool<{
  project: string;
  version: string;
  desc?: string;
  infoOutput?: string;
}>('weapp_http_upload', '使用 HTTP API 上传小程序代码到微信公众平台')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('version', '版本号（必填）', { required: true })
  .stringParam('desc', '版本描述')
  .stringParam('infoOutput', '上传信息输出路径')
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['📤 HTTP 方式上传'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);
      outputLines.push(`🔢 版本号: ${args.version}`);
      if (args.desc) {
        outputLines.push(`📝 版本描述: ${args.desc}`);
      }

      const result = await httpClient.upload(args.project, args.version, args.desc, {
        infoOutput: args.infoOutput,
      });

      if (result.success) {
        outputLines.push('\n✅ 上传请求成功！');
      } else {
        outputLines.push(`\n❌ 上传请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 上传失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 自动预览
 */
const weappHttpAutoPreview = createTool<{
  project: string;
  infoOutput?: string;
}>('weapp_http_auto_preview', '使用 HTTP API 自动预览小程序')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('infoOutput', '预览信息输出路径')
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['👁️ HTTP 方式自动预览'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await httpClient.autoPreview(args.project, {
        infoOutput: args.infoOutput,
      });

      if (result.success) {
        outputLines.push('\n✅ 自动预览请求成功！');
      } else {
        outputLines.push(`\n❌ 自动预览请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 自动预览失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 构建 npm
 */
const weappHttpBuildNpm = createTool<{
  project: string;
  compileType?: 'miniprogram' | 'plugin';
}>('weapp_http_build_npm', '使用 HTTP API 构建 npm')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('compileType', '编译类型', { enum: ['miniprogram', 'plugin'] })
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['📦 HTTP 方式构建 npm'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await httpClient.buildNpm(args.project, args.compileType);

      if (result.success) {
        outputLines.push('\n✅ 构建请求成功！');
      } else {
        outputLines.push(`\n❌ 构建请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 构建失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 清除缓存
 */
const weappHttpClearCache = createTool<{
  project: string;
  clean?: CacheType;
}>('weapp_http_clear_cache', '使用 HTTP API 清除开发者工具缓存。相比 CLI 方式，HTTP 方式支持更精细的缓存类型控制。')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('clean', '缓存类型', {
    enum: ['storage', 'file', 'compile', 'auth', 'network', 'session', 'all'],
    default: 'all',
  })
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const clean = args.clean || 'all';
    const outputLines: string[] = ['🧹 HTTP 方式清除缓存'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);
      outputLines.push(`🗑️ 缓存类型: ${clean}`);

      const result = await httpClient.clearCache(args.project, clean);

      if (result.success) {
        outputLines.push('\n✅ 清除缓存请求成功！');
      } else {
        outputLines.push(`\n❌ 清除缓存请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 清除缓存失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 打开项目
 */
const weappHttpOpen = createTool<{
  project?: string;
}>('weapp_http_open', '使用 HTTP API 打开微信开发者工具或指定项目')
  .stringParam('project', '项目路径（可选）')
  .setHandler(async (args) => {
    if (args.project && !isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['📂 HTTP 方式打开'];

    try {
      if (args.project) {
        outputLines.push(`\n📁 项目路径: ${args.project}`);
      } else {
        outputLines.push('\n🚀 只打开工具（不加载项目）');
      }

      const result = await httpClient.open(args.project);

      if (result.success) {
        outputLines.push('\n✅ 打开请求成功！');
      } else {
        outputLines.push(`\n❌ 打开请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 打开失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 关闭项目
 */
const weappHttpClose = createTool<{
  project: string;
}>('weapp_http_close', '使用 HTTP API 关闭小程序项目')
  .stringParam('project', '项目路径（必填）', { required: true })
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['🚪 HTTP 方式关闭项目'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await httpClient.close(args.project);

      if (result.success) {
        outputLines.push('\n✅ 关闭请求成功！');
      } else {
        outputLines.push(`\n❌ 关闭请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 关闭失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 退出工具
 */
const weappHttpQuit = createTool(
  'weapp_http_quit',
  '使用 HTTP API 退出微信开发者工具'
)
  .setHandler(async () => {
    const outputLines: string[] = ['🚪 HTTP 方式退出工具', ''];

    try {
      const result = await httpClient.quit();

      if (result.success) {
        outputLines.push('✅ 退出请求成功！');
      } else {
        outputLines.push(`❌ 退出请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 退出失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 重置文件监听
 */
const weappHttpResetFileutils = createTool(
  'weapp_http_reset_fileutils',
  '使用 HTTP API 重置文件监听'
)
  .setHandler(async () => {
    const outputLines: string[] = ['🔄 HTTP 方式重置文件监听', ''];

    try {
      const result = await httpClient.resetFileutils();

      if (result.success) {
        outputLines.push('✅ 重置请求成功！');
      } else {
        outputLines.push(`❌ 重置请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 重置失败: ${String(error)}`, true);
    }
  })
  .build();

// ==================== 云开发 HTTP 工具 ====================

/**
 * HTTP 获取云环境列表
 */
const weappHttpCloudEnvList = createTool<{
  project: string;
}>('weapp_http_cloud_env_list', '使用 HTTP API 获取云开发环境列表')
  .stringParam('project', '项目路径（必填）', { required: true })
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['☁️ HTTP 方式获取云环境列表'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);

      const result = await httpClient.cloudEnvList(args.project);

      if (result.success) {
        outputLines.push('\n✅ 请求成功！');
      } else {
        outputLines.push(`\n❌ 请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 请求失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 获取云函数列表
 */
const weappHttpCloudFunctionsList = createTool<{
  project: string;
  env: string;
}>('weapp_http_cloud_functions_list', '使用 HTTP API 获取云函数列表')
  .stringParam('project', '项目路径（必填）', { required: true })
  .stringParam('env', '云环境 ID（必填）', { required: true })
  .setHandler(async (args) => {
    if (!isValidProjectPath(args.project)) {
      return text(
        `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    if (!args.env) {
      return text('错误: 必须提供云环境 ID (env)', true);
    }

    const outputLines: string[] = ['☁️ HTTP 方式获取云函数列表'];

    try {
      outputLines.push(`\n📁 项目路径: ${args.project}`);
      outputLines.push(`🌿 环境 ID: ${args.env}`);

      const result = await httpClient.cloudFunctionsList(args.project, args.env);

      if (result.success) {
        outputLines.push('\n✅ 请求成功！');
      } else {
        outputLines.push(`\n❌ 请求失败`);
      }

      outputLines.push(`\n📊 HTTP 状态码: ${result.statusCode}`);

      if (result.data) {
        outputLines.push(`\n📝 响应数据:`);
        if (typeof result.data === 'string') {
          outputLines.push(result.data);
        } else {
          outputLines.push(JSON.stringify(result.data, null, 2));
        }
      }

      if (result.error) {
        outputLines.push(`\n⚠️ 错误: ${result.error}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 请求失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * HTTP 工具数组
 */
export const httpTools: ToolDefinition[] = [
  weappHttpLogin,
  weappHttpCheckLogin,
  weappHttpPreview,
  weappHttpUpload,
  weappHttpAutoPreview,
  weappHttpBuildNpm,
  weappHttpClearCache,
  weappHttpOpen,
  weappHttpClose,
  weappHttpQuit,
  weappHttpResetFileutils,
  weappHttpCloudEnvList,
  weappHttpCloudFunctionsList,
];
