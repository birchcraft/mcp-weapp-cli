// Jest 测试环境设置

// 设置测试超时时间
jest.setTimeout(30000);

// 模拟 console 方法以避免测试输出污染
global.console = {
  ...console,
  // 保留 error 和 warn 用于调试
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// 模拟微信小程序 CI 模块
jest.mock('miniprogram-ci', () => ({
  Project: jest.fn().mockImplementation(() => ({
    appid: 'test-appid',
    type: 'miniProgram',
  })),
  upload: jest.fn().mockResolvedValue({
    subPackageInfo: [],
  }),
  preview: jest.fn().mockResolvedValue({
    qrCodeUrl: 'https://example.com/qrcode.jpg',
    qrCodeBuffer: new Uint8Array([1, 2, 3, 4]),
  }),
  packNpm: jest.fn().mockResolvedValue({
    packNpmManually: false,
    packNpmRelationList: [],
  }),
}));

// 模拟微信小程序成员管理 CI 模块
jest.mock('miniprogram-mp-ci', () => ({
  addMember: jest.fn().mockResolvedValue({}),
  removeMember: jest.fn().mockResolvedValue({}),
}));

// 模拟文件系统
jest.mock('node:fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('mock-private-key'),
}));

// 模拟路径模块
jest.mock('node:path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// 全局测试工具函数
(global as any).createMockWeappConfig = () => ({
  appid: 'test-appid',
  privateKeyPath: '/path/to/private.key',
  projectPath: '/path/to/project',
  version: '1.0.0',
  desc: '测试版本',
  setting: {
    es6: true,
    es7: true,
    minify: true,
    codeProtect: false,
    autoPrefixWXSS: true,
  },
  robot: 1,
});

(global as any).createMockMCPRequest = (method: string, params?: any) => ({
  jsonrpc: '2.0' as const,
  id: Math.random().toString(36).substr(2, 9),
  method,
  params,
});

// 清理函数
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});