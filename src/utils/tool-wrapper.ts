/**
 * 工具执行包装器
 * 统一处理工具的错误处理和结果格式化
 */
import { ToolResult, CLIResult } from '../types.js';
import { ResultFormatter, FormatOptions } from './result-formatter.js';
import { formatError } from './helpers.js';

/**
 * 工具执行函数类型
 */
export type ToolExecutor<T> = (args: T) => Promise<CLIResult>;

/**
 * 工具验证函数类型
 */
export type ToolValidator<T> = (args: T) => { valid: boolean; error?: ToolResult };

/**
 * 工具包装器选项
 */
export interface ToolWrapperOptions<T> {
  /** 操作名称 */
  operation: string;
  /** 执行函数 */
  executor: ToolExecutor<T>;
  /** 验证函数（可选） */
  validator?: ToolValidator<T>;
  /** 成功时是否包含输出 */
  includeOutput?: boolean;
  /** 自定义成功消息 */
  successMessage?: string;
}

/**
 * 创建工具处理器
 * 统一包装错误处理和结果格式化
 */
export function createToolHandler<T>(
  options: ToolWrapperOptions<T>
): (args: T) => Promise<ToolResult> {
  return async (args: T): Promise<ToolResult> => {
    try {
      // 执行验证
      if (options.validator) {
        const validation = options.validator(args);
        if (!validation.valid && validation.error) {
          return validation.error;
        }
      }

      // 执行 CLI 命令
      const result = await options.executor(args);

      // 格式化结果
      return ResultFormatter.fromCLI(result, {
        operation: options.operation,
        includeOutput: options.includeOutput,
        successMessage: options.successMessage,
      });
    } catch (error) {
      return ResultFormatter.error(error, options.operation);
    }
  };
}

/**
 * 创建带项目路径验证的工具处理器
 */
export function createProjectToolHandler<T extends { project?: string; projectPath?: string }>(
  options: Omit<ToolWrapperOptions<T>, 'validator'> & {
    /** 是否需要项目路径 */
    requireProject?: boolean;
  }
): (args: T) => Promise<ToolResult> {
  return createToolHandler({
    ...options,
    validator: (args: T) => {
      const projectPath = args.project || args.projectPath;

      if (options.requireProject !== false && !projectPath) {
        return {
          valid: false,
          error: {
            content: [
              {
                type: 'text',
                text: '错误: 必须提供项目路径 (project 或 projectPath)',
              },
            ],
            isError: true,
          },
        };
      }

      return { valid: true };
    },
  });
}

/**
 * 创建简单工具处理器（无需参数验证）
 */
export function createSimpleToolHandler(
  operation: string,
  executor: () => Promise<CLIResult>,
  includeOutput = true
): () => Promise<ToolResult> {
  return async (): Promise<ToolResult> => {
    try {
      const result = await executor();
      return ResultFormatter.fromCLI(result, {
        operation,
        includeOutput,
      });
    } catch (error) {
      return ResultFormatter.error(error, operation);
    }
  };
}

/**
 * 工具构建器类
 * 用于链式创建工具定义
 */
export class ToolBuilder<T> {
  private name: string;
  private description: string;
  private inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  private handler: (args: T) => Promise<ToolResult>;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.inputSchema = {
      type: 'object',
      properties: {},
    };
    this.handler = async () => ({
      content: [{ type: 'text', text: '未实现' }],
      isError: true,
    });
  }

  /**
   * 添加字符串参数
   */
  stringParam(
    name: string,
    description: string,
    options?: { required?: boolean; enum?: string[]; default?: string }
  ): this {
    this.inputSchema.properties[name] = {
      type: 'string',
      description,
      ...(options?.enum && { enum: options.enum }),
      ...(options?.default && { default: options.default }),
    };

    if (options?.required) {
      this.inputSchema.required = this.inputSchema.required || [];
      this.inputSchema.required.push(name);
    }

    return this;
  }

  /**
   * 添加布尔参数
   */
  booleanParam(name: string, description: string, options?: { required?: boolean }): this {
    this.inputSchema.properties[name] = {
      type: 'boolean',
      description,
    };

    if (options?.required) {
      this.inputSchema.required = this.inputSchema.required || [];
      this.inputSchema.required.push(name);
    }

    return this;
  }

  /**
   * 添加数字参数
   */
  numberParam(name: string, description: string, options?: { required?: boolean }): this {
    this.inputSchema.properties[name] = {
      type: 'number',
      description,
    };

    if (options?.required) {
      this.inputSchema.required = this.inputSchema.required || [];
      this.inputSchema.required.push(name);
    }

    return this;
  }

  /**
   * 添加数组参数
   */
  arrayParam(name: string, description: string, options?: { required?: boolean }): this {
    this.inputSchema.properties[name] = {
      type: 'array',
      items: { type: 'string' },
      description,
    };

    if (options?.required) {
      this.inputSchema.required = this.inputSchema.required || [];
      this.inputSchema.required.push(name);
    }

    return this;
  }

  /**
   * 设置处理器
   */
  setHandler(handler: (args: T) => Promise<ToolResult>): this {
    this.handler = handler;
    return this;
  }

  /**
   * 使用包装器设置处理器
   */
  wrapHandler(options: ToolWrapperOptions<T>): this {
    this.handler = createToolHandler(options);
    return this;
  }

  /**
   * 构建工具定义
   */
  build() {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      handler: this.handler,
    };
  }
}

/**
 * 创建工具构建器
 */
export function createTool<T>(name: string, description: string): ToolBuilder<T> {
  return new ToolBuilder<T>(name, description);
}
