import { LogLevel } from '../types';

export class Logger {
  private level: LogLevel;
  private readonly levels = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
  };

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 检查是否应该记录指定级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const levelName = LogLevel[level];
    return `[${timestamp}] [${levelName}] ${message}${metaStr}`;
  }

  /**
   * 记录错误日志
   */
  public error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
  }

  /**
   * 记录警告日志
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  /**
   * 记录信息日志
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  /**
   * 记录调试日志
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  /**
   * 创建子日志器
   */
  public child(prefix: string): Logger {
    const childLogger = new Logger(this.level);
    const originalMethods = {
      error: childLogger.error.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      debug: childLogger.debug.bind(childLogger),
    };

    childLogger.error = (message: string, meta?: Record<string, unknown>) => {
      originalMethods.error(`[${prefix}] ${message}`, meta);
    };
    childLogger.warn = (message: string, meta?: Record<string, unknown>) => {
      originalMethods.warn(`[${prefix}] ${message}`, meta);
    };
    childLogger.info = (message: string, meta?: Record<string, unknown>) => {
      originalMethods.info(`[${prefix}] ${message}`, meta);
    };
    childLogger.debug = (message: string, meta?: Record<string, unknown>) => {
      originalMethods.debug(`[${prefix}] ${message}`, meta);
    };

    return childLogger;
  }
}