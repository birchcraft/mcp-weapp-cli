/**
 * 云开发相关工具
 * 提供云环境管理、云函数部署等操作
 */

import { cliClient } from '../cli-client.js';
import { ToolDefinition, ToolResult } from '../types.js';
import { formatError } from '../utils/helpers.js';

/**
 * 执行获取云环境列表
 */
async function executeCloudEnvList(args: { project: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.cloudEnvList(args.project);

    if (result.success) {
      // 合并 stdout 和 stderr，因为 Windows 上部分输出可能在 stderr
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `获取云环境列表成功\n${output || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `获取云环境列表失败 (退出码: ${result.code})\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行获取云函数列表
 */
async function executeCloudFunctionsList(args: { project: string; env: string }): Promise<ToolResult> {
  try {
    const result = await cliClient.cloudFunctionsList(args.project, args.env);

    if (result.success) {
      // 合并 stdout 和 stderr，因为 Windows 上部分输出可能在 stderr
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `获取云函数列表成功\n环境: ${args.env}\n${output || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `获取云函数列表失败 (退出码: ${result.code})\n环境: ${args.env}\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行获取云函数信息
 */
async function executeCloudFunctionsInfo(args: {
  project: string;
  env: string;
  names: string[];
}): Promise<ToolResult> {
  try {
    const result = await cliClient.cloudFunctionsInfo(args.project, args.env, args.names);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `获取云函数信息成功\n环境: ${args.env}\n函数: ${args.names.join(', ')}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `获取云函数信息失败 (退出码: ${result.code})\n环境: ${args.env}\n函数: ${args.names.join(', ')}\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行部署云函数
 */
async function executeCloudFunctionsDeploy(args: {
  project: string;
  env: string;
  names?: string[];
  paths?: string[];
  remoteNpmInstall?: boolean;
}): Promise<ToolResult> {
  try {
    // 验证 names 和 paths 至少提供一个
    if ((!args.names || args.names.length === 0) && (!args.paths || args.paths.length === 0)) {
      return {
        content: [
          {
            type: 'text',
            text: '参数错误: 必须提供 names（云函数名称列表）或 paths（云函数路径列表）之一',
          },
        ],
        isError: true,
      };
    }

    const result = await cliClient.cloudFunctionsDeploy(args.project, args.env, {
      names: args.names,
      paths: args.paths,
      remoteNpmInstall: args.remoteNpmInstall,
    });

    if (result.success) {
      const details: string[] = [];
      if (args.names && args.names.length > 0) {
        details.push(`函数名称: ${args.names.join(', ')}`);
      }
      if (args.paths && args.paths.length > 0) {
        details.push(`函数路径: ${args.paths.join(', ')}`);
      }
      if (args.remoteNpmInstall) {
        details.push('远程安装 npm 依赖: 是');
      }

      // 合并 stdout 和 stderr，因为 Windows 上部分输出可能在 stderr
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `部署云函数成功\n环境: ${args.env}\n${details.join('\n')}\n${output || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `部署云函数失败 (退出码: ${result.code})\n环境: ${args.env}\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行增量部署云函数
 */
async function executeCloudFunctionsIncDeploy(args: {
  project: string;
  env: string;
  names?: string[];
  paths?: string[];
  remoteNpmInstall?: boolean;
}): Promise<ToolResult> {
  try {
    // 验证 names 和 paths 至少提供一个
    if ((!args.names || args.names.length === 0) && (!args.paths || args.paths.length === 0)) {
      return {
        content: [
          {
            type: 'text',
            text: '参数错误: 必须提供 names（云函数名称列表）或 paths（云函数路径列表）之一',
          },
        ],
        isError: true,
      };
    }

    const result = await cliClient.cloudFunctionsIncDeploy(args.project, args.env, {
      names: args.names,
      paths: args.paths,
      remoteNpmInstall: args.remoteNpmInstall,
    });

    if (result.success) {
      const details: string[] = [];
      if (args.names && args.names.length > 0) {
        details.push(`函数名称: ${args.names.join(', ')}`);
      }
      if (args.paths && args.paths.length > 0) {
        details.push(`函数路径: ${args.paths.join(', ')}`);
      }
      if (args.remoteNpmInstall) {
        details.push('远程安装 npm 依赖: 是');
      }

      return {
        content: [
          {
            type: 'text',
            text: `增量部署云函数成功\n环境: ${args.env}\n${details.join('\n')}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `增量部署云函数失败 (退出码: ${result.code})\n环境: ${args.env}\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 执行下载云函数
 */
async function executeCloudFunctionsDownload(args: {
  project: string;
  env: string;
  name: string;
}): Promise<ToolResult> {
  try {
    const result = await cliClient.cloudFunctionsDownload(args.project, args.env, args.name);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `下载云函数成功\n环境: ${args.env}\n函数: ${args.name}\n${result.stdout || ''}`.trim(),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `下载云函数失败 (退出码: ${result.code})\n环境: ${args.env}\n函数: ${args.name}\n${result.stderr || result.stdout || '未知错误'}`,
          },
        ],
        isError: true,
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${formatError(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 云开发工具定义
 */
export const cloudTools: ToolDefinition[] = [
  {
    name: 'weapp_cloud_env_list',
    description: '获取微信小程序云开发环境列表。返回当前小程序账号下的所有云开发环境信息。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
      },
      required: ['project'],
    },
    handler: executeCloudEnvList,
  },
  {
    name: 'weapp_cloud_functions_list',
    description: '获取指定云环境下的云函数列表。返回该环境下所有已部署的云函数信息。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
        env: {
          type: 'string',
          description: '云环境 ID（必填）。要查询的云开发环境标识',
        },
      },
      required: ['project', 'env'],
    },
    handler: executeCloudFunctionsList,
  },
  {
    name: 'weapp_cloud_functions_info',
    description: '获取指定云函数的详细信息。包括函数配置、状态、运行环境等信息。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
        env: {
          type: 'string',
          description: '云环境 ID（必填）。云函数所在的云开发环境标识',
        },
        names: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '云函数名称列表（必填）。要查询的云函数名称数组',
        },
      },
      required: ['project', 'env', 'names'],
    },
    handler: executeCloudFunctionsInfo,
  },
  {
    name: 'weapp_cloud_functions_deploy',
    description: '部署云函数到云端。可以将本地开发的云函数完整部署到指定的云环境中。支持通过函数名称或函数路径指定要部署的函数，可选择是否在云端安装 npm 依赖。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
        env: {
          type: 'string',
          description: '云环境 ID（必填）。要部署到的云开发环境标识',
        },
        names: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '云函数名称列表（与 paths 二选一）。要部署的云函数名称数组',
        },
        paths: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '云函数路径列表（与 names 二选一）。要部署的云函数本地路径数组',
        },
        remoteNpmInstall: {
          type: 'boolean',
          description: '是否在云端安装 npm 依赖（可选）。设为 true 时会在云端执行 npm install',
        },
      },
      required: ['project', 'env'],
    },
    handler: executeCloudFunctionsDeploy,
  },
  {
    name: 'weapp_cloud_functions_inc_deploy',
    description: '增量部署云函数到云端。只部署云函数的变更部分，速度更快。适用于大型云函数或仅需更新部分代码的场景。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
        env: {
          type: 'string',
          description: '云环境 ID（必填）。要部署到的云开发环境标识',
        },
        names: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '云函数名称列表（与 paths 二选一）。要增量部署的云函数名称数组',
        },
        paths: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '云函数路径列表（与 names 二选一）。要增量部署的云函数本地路径数组',
        },
        remoteNpmInstall: {
          type: 'boolean',
          description: '是否在云端安装 npm 依赖（可选）。设为 true 时会在云端执行 npm install',
        },
      },
      required: ['project', 'env'],
    },
    handler: executeCloudFunctionsIncDeploy,
  },
  {
    name: 'weapp_cloud_functions_download',
    description: '从云端下载云函数代码到本地。用于将已部署的云函数代码下载到本地进行查看或修改。',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录',
        },
        env: {
          type: 'string',
          description: '云环境 ID（必填）。云函数所在的云开发环境标识',
        },
        name: {
          type: 'string',
          description: '云函数名称（必填）。要下载的云函数名称',
        },
      },
      required: ['project', 'env', 'name'],
    },
    handler: executeCloudFunctionsDownload,
  },
];

/**
 * 工具执行映射表（向后兼容）
 * @deprecated 直接使用工具的 handler 方法
 */
export const cloudToolExecutors = {
  weapp_cloud_env_list: executeCloudEnvList,
  weapp_cloud_functions_list: executeCloudFunctionsList,
  weapp_cloud_functions_info: executeCloudFunctionsInfo,
  weapp_cloud_functions_deploy: executeCloudFunctionsDeploy,
  weapp_cloud_functions_inc_deploy: executeCloudFunctionsIncDeploy,
  weapp_cloud_functions_download: executeCloudFunctionsDownload,
};
