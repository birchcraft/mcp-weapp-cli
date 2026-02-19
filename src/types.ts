/**
 * 微信小程序开发者工具 MCP 类型定义
 */

// CLI 执行结果
export interface CLIResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

// CLI 执行选项
export interface CLIExecuteOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

// MCP 工具定义
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<ToolResult>;
}

// MCP 工具执行结果
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

// MCP 资源定义
export interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// MCP 提示符定义
export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// 微信开发者工具配置
export interface WeappConfig {
  cliPath?: string;
  port?: number;
  lang?: 'en' | 'zh';
  debug?: boolean;
  projectPath?: string;
  appid?: string;
  extAppid?: string;
}

// 云函数信息
export interface CloudFunctionInfo {
  name: string;
  env: string;
  status: string;
  runtime?: string;
  handler?: string;
  memorySize?: number;
  timeout?: number;
  lastModified?: string;
}

// 云环境信息
export interface CloudEnvInfo {
  env: string;
  alias?: string;
  packageName?: string;
  packageId?: string;
}

// 预览信息
export interface PreviewInfo {
  qrCodeUrl?: string;
  pagePath?: string;
  scene?: number;
  checkExpireTime?: number;
}

// 上传信息
export interface UploadInfo {
  subPackageInfo?: Array<{
    name: string;
    size: number;
  }>;
  pluginInfo?: Array<{
    pluginProviderAppid: string;
    pluginVersion: string;
  }>;
  devPluginId?: string;
  compileJs?: boolean;
  usePlugin?: boolean;
}

// 错误信息
export interface WeappError {
  code: number;
  message: string;
  suggestion?: string;
  details?: string;
}

// 登录结果
export interface LoginResult {
  success: boolean;
  nickname?: string;
  avatar?: string;
  uid?: string;
}

// CLI 命令枚举
export enum CLICommand {
  LOGIN = 'login',
  IS_LOGIN = 'islogin',
  PREVIEW = 'preview',
  AUTO_PREVIEW = 'auto-preview',
  UPLOAD = 'upload',
  OPEN = 'open',
  OPEN_OTHER = 'open-other',
  CLOSE = 'close',
  QUIT = 'quit',
  BUILD_NPM = 'build-npm',
  CACHE = 'cache',
  AUTO = 'auto',
  AUTO_REPLAY = 'auto-replay',
  CLOUD_ENV_LIST = 'cloud env list',
  CLOUD_FUNCTIONS_LIST = 'cloud functions list',
  CLOUD_FUNCTIONS_INFO = 'cloud functions info',
  CLOUD_FUNCTIONS_DEPLOY = 'cloud functions deploy',
  CLOUD_FUNCTIONS_INC_DEPLOY = 'cloud functions inc-deploy',
  CLOUD_FUNCTIONS_DOWNLOAD = 'cloud functions download',
  RESET_FILEUTILS = 'reset-fileutils',
  ENGINE_BUILD = 'engine build',
}

// 缓存类型
export type CacheType = 'storage' | 'file' | 'compile' | 'auth' | 'network' | 'session' | 'all';

// 二维码格式
export type QRFormat = 'terminal' | 'image' | 'base64';

// 二维码大小
export type QRSize = 'small' | 'default';

// 编译类型
export type CompileType = 'miniprogram' | 'plugin';
