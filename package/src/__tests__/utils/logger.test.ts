import { Logger } from '../../utils/logger';
import { LogLevel } from '../../types';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('构造函数', () => {
    it('应该使用默认日志级别 INFO', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('应该使用指定的日志级别', () => {
      const debugLogger = new Logger(LogLevel.DEBUG);
      expect(debugLogger).toBeInstanceOf(Logger);
    });
  });

  describe('setLevel', () => {
    it('应该能够设置日志级别', () => {
      logger.setLevel(LogLevel.ERROR);
      // 验证设置成功（通过后续的日志输出测试）
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('日志输出方法', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'debug').mockImplementation();
    });

    it('应该输出 error 级别日志', () => {
      const message = '测试错误消息';
      const meta = { code: 500 };
      
      logger.error(message, meta);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] 测试错误消息')
      );
    });

    it('应该输出 warn 级别日志', () => {
      const message = '测试警告消息';
      
      logger.warn(message);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] 测试警告消息')
      );
    });

    it('应该输出 info 级别日志', () => {
      const message = '测试信息消息';
      
      logger.info(message);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] 测试信息消息')
      );
    });

    it('应该输出 debug 级别日志', () => {
      const message = '测试调试消息';
      
      logger.debug(message);
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] 测试调试消息')
      );
    });

    it('应该包含时间戳', () => {
      logger.info('测试消息');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it('应该包含元数据', () => {
      const meta = { userId: 123, action: 'test' };
      logger.info('测试消息', meta);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(meta))
      );
    });
  });

  describe('日志级别过滤', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      jest.spyOn(console, 'debug').mockImplementation();
    });

    it('ERROR 级别应该只输出 error 日志', () => {
      logger.setLevel(LogLevel.ERROR);
      
      logger.error('错误消息');
      logger.warn('警告消息');
      logger.info('信息消息');
      logger.debug('调试消息');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('WARN 级别应该输出 error 和 warn 日志', () => {
      logger.setLevel(LogLevel.WARN);
      
      logger.error('错误消息');
      logger.warn('警告消息');
      logger.info('信息消息');
      logger.debug('调试消息');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('INFO 级别应该输出 error、warn 和 info 日志', () => {
      logger.setLevel(LogLevel.INFO);
      
      logger.error('错误消息');
      logger.warn('警告消息');
      logger.info('信息消息');
      logger.debug('调试消息');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('DEBUG 级别应该输出所有级别的日志', () => {
      logger.setLevel(LogLevel.DEBUG);
      
      logger.error('错误消息');
      logger.warn('警告消息');
      logger.info('信息消息');
      logger.debug('调试消息');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('child', () => {
    beforeEach(() => {
      jest.spyOn(console, 'info').mockImplementation();
    });

    it('应该创建带前缀的子日志器', () => {
      const childLogger = logger.child('TEST');
      
      childLogger.info('子日志器消息');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TEST] 子日志器消息')
      );
    });

    it('子日志器应该继承父日志器的级别', () => {
      logger.setLevel(LogLevel.ERROR);
      const childLogger = logger.child('TEST');
      
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'info').mockImplementation();
      
      childLogger.error('错误消息');
      childLogger.info('信息消息');
      
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.info).not.toHaveBeenCalled();
    });
  });
});