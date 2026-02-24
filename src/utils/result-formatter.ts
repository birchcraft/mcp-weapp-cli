/**
 * 结果格式化器
 * 统一 MCP 工具的输出格式
 */
import { ToolResult } from '../types.js';
import { formatError } from './helpers.js';

/**
 * 结果内容项
 */
export interface ResultContent {
  text: string;
}

/**
 * 格式化选项
 */
export interface FormatOptions {
  /** 操作名称，用于生成消息 */
  operation: string;
  /** 成功时是否包含输出 */
  includeOutput?: boolean;
  /** 额外的成功消息 */
  successMessage?: string;
  /** 额外的错误消息 */
  errorMessage?: string;
}

/**
 * 结果格式化器类
 * 提供统一的工具结果格式化方法
 */
export class ResultFormatter {
  /**
   * 格式化成功结果
   */
  static success(data: {
    message?: string;
    details?: Record<string, unknown>;
    output?: string;
  }): ToolResult {
    const lines: string[] = [];

    if (data.message) {
      lines.push(`✓ ${data.message}`);
    }

    if (data.details && Object.keys(data.details).length > 0) {
      lines.push('');
      lines.push('📋 详情:');
      for (const [key, value] of Object.entries(data.details)) {
        if (value !== undefined && value !== null) {
          lines.push(`   ${key}: ${String(value)}`);
        }
      }
    }

    if (data.output) {
      lines.push('');
      lines.push('📝 输出:');
      lines.push(data.output);
    }

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  /**
   * 格式化错误结果
   */
  static error(error: unknown, context?: string): ToolResult {
    const errorMessage = formatError(error);
    const prefix = context ? `${context}: ` : '';

    return {
      content: [
        {
          type: 'text',
          text: `✗ ${prefix}${errorMessage}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * 格式化 CLI 执行结果
   * 根据 CLI 返回的 success 和输出内容格式化
   */
  static fromCLI(
    result: {
      success: boolean;
      code: number;
      stdout: string;
      stderr: string;
    },
    options: FormatOptions
  ): ToolResult {
    if (result.success) {
      // 合并 stdout 和 stderr（Windows 上部分输出可能在 stderr）
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n');

      return this.success({
        message: options.successMessage || `${options.operation}成功`,
        output: options.includeOutput !== false ? output : undefined,
      });
    } else {
      const errorOutput = result.stderr || result.stdout || '未知错误';
      return this.error(
        new Error(`${options.operation}失败 (退出码: ${result.code})\n\n${errorOutput}`)
      );
    }
  }

  /**
   * 格式化 JSON 数据结果
   */
  static json(data: unknown, isError = false): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
      isError,
    };
  }

  /**
   * 格式化原始文本结果
   */
  static text(text: string, isError = false): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
      isError,
    };
  }
}

/**
 * 便捷函数：成功结果
 */
export function success(message: string, details?: Record<string, unknown>): ToolResult {
  return ResultFormatter.success({ message, details });
}

/**
 * 便捷函数：错误结果
 */
export function error(error: unknown, context?: string): ToolResult {
  return ResultFormatter.error(error, context);
}

/**
 * 便捷函数：从 CLI 结果格式化
 */
export function fromCLI(
  result: {
    success: boolean;
    code: number;
    stdout: string;
    stderr: string;
  },
  options: FormatOptions
): ToolResult {
  return ResultFormatter.fromCLI(result, options);
}

/**
 * 便捷函数：JSON 结果
 */
export function json(data: unknown, isError = false): ToolResult {
  return ResultFormatter.json(data, isError);
}

/**
 * 便捷函数：文本结果
 */
export function text(content: string, isError = false): ToolResult {
  return ResultFormatter.text(content, isError);
}
