#!/usr/bin/env node
/**
 * 微信小程序开发者工具 MCP 服务器
 * 主入口文件
 */
import { WeappMCPServer } from './server.js';
import { logger } from './utils/logger.js';

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    const server = new WeappMCPServer();

    // 优雅关闭处理
    process.on('SIGINT', async () => {
      logger.info('收到 SIGINT 信号，正在关闭服务器...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('收到 SIGTERM 信号，正在关闭服务器...');
      await server.stop();
      process.exit(0);
    });

    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的 Promise 拒绝:', reason);
    });

    // 启动服务器
    await server.start();
  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动
main();
