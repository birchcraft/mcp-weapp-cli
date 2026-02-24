/**
 * 云开发相关工具
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition } from '../types.js';
import { createTool } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * 获取云环境列表
 */
const weappCloudEnvList = createTool<{ project: string }>(
  'weapp_cloud_env_list',
  '获取微信小程序云开发环境列表。返回当前小程序账号下的所有云开发环境信息。'
)
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .wrapHandler({
    operation: '获取云环境列表',
    executor: async (args) => cliClient.cloudEnvList(args.project),
  })
  .build();

/**
 * 获取云函数列表
 */
const weappCloudFunctionsList = createTool<{ project: string; env: string }>(
  'weapp_cloud_functions_list',
  '获取指定云环境下的云函数列表。返回该环境下所有已部署的云函数信息。'
)
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .stringParam('env', '云环境 ID（必填）。要查询的云开发环境标识', { required: true })
  .wrapHandler({
    operation: '获取云函数列表',
    executor: async (args) => cliClient.cloudFunctionsList(args.project, args.env),
  })
  .build();

/**
 * 获取云函数信息
 */
const weappCloudFunctionsInfo = createTool<{
  project: string;
  env: string;
  names: string[];
}>('weapp_cloud_functions_info', '获取指定云函数的详细信息。包括函数配置、状态、运行环境等信息。')
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .stringParam('env', '云环境 ID（必填）。云函数所在的云开发环境标识', { required: true })
  .arrayParam('names', '云函数名称列表（必填）。要查询的云函数名称数组', { required: true })
  .wrapHandler({
    operation: '获取云函数信息',
    executor: async (args) => cliClient.cloudFunctionsInfo(args.project, args.env, args.names),
  })
  .build();

/**
 * 部署云函数
 */
const weappCloudFunctionsDeploy = createTool<{
  project: string;
  env: string;
  names?: string[];
  paths?: string[];
  remoteNpmInstall?: boolean;
}>('weapp_cloud_functions_deploy', '部署云函数到云端。可以将本地开发的云函数完整部署到指定的云环境中。')
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .stringParam('env', '云环境 ID（必填）。要部署到的云开发环境标识', { required: true })
  .arrayParam('names', '云函数名称列表（与 paths 二选一）。要部署的云函数名称数组')
  .arrayParam('paths', '云函数路径列表（与 names 二选一）。要部署的云函数本地路径数组')
  .booleanParam('remoteNpmInstall', '是否在云端安装 npm 依赖（可选）。设为 true 时会在云端执行 npm install')
  .wrapHandler({
    operation: '部署云函数',
    executor: async (args) =>
      cliClient.cloudFunctionsDeploy(args.project, args.env, {
        names: args.names,
        paths: args.paths,
        remoteNpmInstall: args.remoteNpmInstall,
      }),
    validator: (args) => {
      if ((!args.names || args.names.length === 0) && (!args.paths || args.paths.length === 0)) {
        return {
          valid: false,
          error: text('参数错误: 必须提供 names（云函数名称列表）或 paths（云函数路径列表）之一', true),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 增量部署云函数
 */
const weappCloudFunctionsIncDeploy = createTool<{
  project: string;
  env: string;
  names?: string[];
  paths?: string[];
  remoteNpmInstall?: boolean;
}>('weapp_cloud_functions_inc_deploy', '增量部署云函数到云端。只部署云函数的变更部分，速度更快。')
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .stringParam('env', '云环境 ID（必填）。要部署到的云开发环境标识', { required: true })
  .arrayParam('names', '云函数名称列表（与 paths 二选一）。要增量部署的云函数名称数组')
  .arrayParam('paths', '云函数路径列表（与 names 二选一）。要增量部署的云函数本地路径数组')
  .booleanParam('remoteNpmInstall', '是否在云端安装 npm 依赖（可选）。设为 true 时会在云端执行 npm install')
  .wrapHandler({
    operation: '增量部署云函数',
    executor: async (args) =>
      cliClient.cloudFunctionsIncDeploy(args.project, args.env, {
        names: args.names,
        paths: args.paths,
        remoteNpmInstall: args.remoteNpmInstall,
      }),
    validator: (args) => {
      if ((!args.names || args.names.length === 0) && (!args.paths || args.paths.length === 0)) {
        return {
          valid: false,
          error: text('参数错误: 必须提供 names（云函数名称列表）或 paths（云函数路径列表）之一', true),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 下载云函数
 */
const weappCloudFunctionsDownload = createTool<{
  project: string;
  env: string;
  name: string;
}>('weapp_cloud_functions_download', '从云端下载云函数代码到本地。用于将已部署的云函数代码下载到本地进行查看或修改。')
  .stringParam('project', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .stringParam('env', '云环境 ID（必填）。云函数所在的云开发环境标识', { required: true })
  .stringParam('name', '云函数名称（必填）。要下载的云函数名称', { required: true })
  .wrapHandler({
    operation: '下载云函数',
    executor: async (args) => cliClient.cloudFunctionsDownload(args.project, args.env, args.name),
  })
  .build();

/**
 * 云开发工具数组
 */
export const cloudTools: ToolDefinition[] = [
  weappCloudEnvList,
  weappCloudFunctionsList,
  weappCloudFunctionsInfo,
  weappCloudFunctionsDeploy,
  weappCloudFunctionsIncDeploy,
  weappCloudFunctionsDownload,
];
