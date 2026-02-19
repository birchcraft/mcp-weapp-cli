/**
 * 微信小程序开发者工具 MCP 服务器类型定义
 */

// 日志级别枚举
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// CLI 工具配置
export interface CliConfig {
  cliPath?: string; // CLI 工具路径（自动检测）
  port?: number; // 开发者工具服务端口
  lang?: 'en' | 'zh'; // 命令行语言
  debug?: boolean; // 调试模式
}

// 项目配置
export interface ProjectConfig {
  project: string; // 项目根目录路径
  appid?: string; // 小程序 AppID（可选，从项目配置读取）
  extAppid?: string; // 第三方平台开发时的 AppID
}

// 服务器配置
export interface ServerConfig {
  name?: string; // 服务器名称
  version?: string; // 服务器版本
  logLevel?: LogLevel; // 日志级别
  maxRequestSize?: number; // 最大请求大小
  timeout?: number; // 请求超时时间（毫秒）
  cliConfig?: CliConfig; // CLI 工具配置
}

// 二维码格式
export type QRFormat = 'terminal' | 'image' | 'base64';

// 二维码大小
export type QRSize = 'small' | 'default';

// 编译类型
export type CompileType = 'miniprogram' | 'plugin';

// 登录工具参数
export interface LoginParams {
  qrFormat?: QRFormat;
  qrSize?: QRSize;
  qrOutput?: string;
  resultOutput?: string;
}

// 预览参数
export interface PreviewParams {
  project: string;
  qrFormat?: QRFormat;
  qrSize?: QRSize;
  qrOutput?: string;
  infoOutput?: string;
}

// 自动预览参数
export interface AutoPreviewParams {
  project: string;
  infoOutput?: string;
}

// 上传参数
export interface UploadParams {
  project: string;
  version: string;
  desc?: string;
  infoOutput?: string;
}

// 构建 npm 参数
export interface BuildNpmParams {
  project: string;
  compileType?: CompileType;
}

// 缓存清理参数
export interface CacheParams {
  project: string;
}

// 工具管理参数
export interface ToolParams {
  project?: string;
}

// 云函数列表参数
export interface CloudFunctionsListParams {
  project: string;
}

// 云函数部署参数
export interface CloudFunctionsDeployParams {
  project: string;
  functionName: string;
  functionPath: string;
}

// CLI 命令执行结果
export interface CliResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

// 登录结果
export interface LoginResult extends CliResult {
  qrCodePath?: string;
  resultPath?: string;
}

// 预览结果
export interface PreviewResult extends CliResult {
  qrCodePath?: string;
  infoPath?: string;
  packageInfo?: any;
}

// 上传结果
export interface UploadResult extends CliResult {
  infoPath?: string;
  packageInfo?: any;
}

// 构建结果
export interface BuildResult extends CliResult {
  buildInfo?: any;
}

// MCP 工具定义
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// MCP 资源定义
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// MCP 提示符定义
export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
  }[];
}

// 错误类型
export class WeappError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WeappError';
  }
}

// CLI 工具检测结果
export interface CliDetectionResult {
  found: boolean;
  path?: string;
  version?: string;
  error?: string;
}

// MCP 协议相关类型
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// MCP 错误代码
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;