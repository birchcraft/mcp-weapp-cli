/**
 * 项目管理相关工具
 */
import { cliClient } from '../cli-client.js';
import { httpClient } from '../http-client.js';
import { ToolDefinition } from '../types.js';
import { isValidProjectPath } from '../utils/helpers.js';
import { createTool, createSimpleToolHandler } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * 启动开发者工具（不打开项目）
 */
const weappOpenTool = createTool<{
  httpPort?: number;
  lang?: string;
  debug?: boolean;
}>(
  'weapp_open_tool',
  '启动微信开发者工具（不打开项目）。启动前会检测并关闭其他运行中的实例，确保只有一个实例运行。返回实际的 HTTP 服务端口号。'
)
  .numberParam('httpPort', 'HTTP 服务端口（可选，默认自动分配）。注意：这是 HTTP 服务端口，不是自动化端口。')
  .stringParam('lang', '语言设置（可选）', { enum: ['en', 'zh'] })
  .booleanParam('debug', '开启调试模式（可选）')
  .setHandler(async (args) => {
    const outputLines: string[] = ['🚀 启动微信开发者工具'];

    try {
      // 执行启动命令
      const result = await cliClient.openTool({
        httpPort: args.httpPort,
        lang: args.lang,
        debug: args.debug,
      });

      // 获取 HTTP 端口信息
      const specifiedPort = args.httpPort;
      const actualPort = result.httpPort;

      // 构建返回信息
      if (result.success) {
        outputLines.push('✅ 开发者工具启动成功！\n');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}\n`);
      }

      outputLines.push('📋 HTTP 服务信息:');
      if (specifiedPort) {
        outputLines.push(`   指定的 HTTP 端口: ${specifiedPort}`);
      } else {
        outputLines.push(`   指定的 HTTP 端口: 自动分配`);
      }

      if (actualPort) {
        if (specifiedPort && actualPort !== specifiedPort) {
          outputLines.push(`   ⚠️ 实际的 HTTP 端口: ${actualPort} (与指定端口不同！)`);
          outputLines.push(`\n   警告: HTTP 端口与指定值不匹配`);
          outputLines.push(`   可能原因:`);
          outputLines.push(`      1. 指定端口已被其他程序占用`);
          outputLines.push(`      2. 工具已在其他端口运行`);
          outputLines.push(`   建议: 先执行 weapp_quit 关闭工具，然后重新启动。`);
        } else {
          outputLines.push(`   ✅ 实际的 HTTP 端口: ${actualPort} (与指定一致)`);
        }
        outputLines.push(`   HTTP 服务地址: http://127.0.0.1:${actualPort}`);
      } else {
        outputLines.push(`   ⚠️ 无法从 CLI 输出中解析 HTTP 端口号`);
      }

      // 添加 CLI 输出
      if (result.stdout) {
        outputLines.push(`\n📝 CLI 输出:\n${result.stdout}`);
      }

      if (result.stderr) {
        outputLines.push(`\n⚠️ CLI 错误输出:\n${result.stderr}`);
      }

      outputLines.push(`\n💡 提示:`);
      outputLines.push(`   - HTTP 服务端口用于 CLI 和 HTTP API 通信`);
      outputLines.push(`   - 如需开启自动化测试，请使用 weapp_auto 工具`);
      outputLines.push(`   - 使用 weapp_http_detect_port 可以检测当前 HTTP 端口`);

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 启动开发者工具失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 打开指定项目
 */
const weappOpenProject = createTool<{
  projectPath: string;
  httpPort?: number;
  lang?: string;
  debug?: boolean;
}>(
  'weapp_open_project',
  '打开指定的小程序项目。会先确保没有其他项目实例运行，然后打开项目。返回实际的 HTTP 服务端口号。'
)
  .stringParam('projectPath', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', { required: true })
  .numberParam('httpPort', 'HTTP 服务端口（可选）')
  .stringParam('lang', '语言设置（可选）', { enum: ['en', 'zh'] })
  .booleanParam('debug', '开启调试模式（可选）')
  .setHandler(async (args) => {
    // 参数验证
    if (!args.projectPath) {
      return text('错误: 必须提供项目路径 (projectPath)', true);
    }

    if (!isValidProjectPath(args.projectPath)) {
      return text(
        `错误: 无效的项目路径: ${args.projectPath}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    const outputLines: string[] = ['📂 打开小程序项目'];

    try {
      // 执行打开命令
      outputLines.push(`\n📁 项目路径: ${args.projectPath}`);
      outputLines.push('🔄 正在关闭其他项目实例...\n');

      const result = await cliClient.openProject(args.projectPath, {
        httpPort: args.httpPort,
        lang: args.lang,
        debug: args.debug,
      });

      // 获取 HTTP 端口信息
      const specifiedPort = args.httpPort;
      const actualPort = result.httpPort;

      // 构建返回信息
      if (result.success) {
        outputLines.push('✅ 项目打开成功！\n');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}\n`);
      }

      outputLines.push('📋 HTTP 服务信息:');
      if (specifiedPort) {
        outputLines.push(`   指定的 HTTP 端口: ${specifiedPort}`);
      } else {
        outputLines.push(`   指定的 HTTP 端口: 自动分配`);
      }

      if (actualPort) {
        if (specifiedPort && actualPort !== specifiedPort) {
          outputLines.push(`   ⚠️ 实际的 HTTP 端口: ${actualPort} (与指定端口不同！)`);
        } else {
          outputLines.push(`   ✅ 实际的 HTTP 端口: ${actualPort}`);
        }
        outputLines.push(`   HTTP 服务地址: http://127.0.0.1:${actualPort}`);
      } else {
        outputLines.push(`   ⚠️ 无法从 CLI 输出中解析 HTTP 端口号`);
      }

      // 添加 CLI 输出
      if (result.stdout) {
        outputLines.push(`\n📝 CLI 输出:\n${result.stdout}`);
      }

      if (result.stderr) {
        outputLines.push(`\n⚠️ CLI 错误输出:\n${result.stderr}`);
      }

      outputLines.push(`\n💡 提示:`);
      outputLines.push(`   - 项目已打开，如需预览请使用 weapp_preview 或 weapp_auto_preview`);
      outputLines.push(`   - 如需开启自动化测试，请使用 weapp_auto 工具`);

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 打开项目失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 以其他模式打开
 */
const weappOpenOther = createTool<{ projectPath: string }>(
  'weapp_open_other',
  '以其他模式打开微信小程序项目。会以独立窗口或不同模式打开项目，用于特殊场景下的开发调试。'
)
  .stringParam('projectPath', '项目路径（必填）。小程序项目根目录，包含 project.config.json 的目录', {
    required: true,
  })
  .setHandler(async (args) => {
    if (!args.projectPath) {
      return text('错误: 必须提供项目路径 (projectPath)', true);
    }

    if (!isValidProjectPath(args.projectPath)) {
      return text(
        `错误: 无效的项目路径: ${args.projectPath}\n请确保路径存在且包含 project.config.json 文件。`,
        true
      );
    }

    try {
      const result = await cliClient.openOther(args.projectPath);
      return text([
        '🔄 以其他模式打开项目',
        `\n📁 项目路径: ${args.projectPath}`,
        result.success ? '\n✅ 操作成功！' : `\n⚠️ CLI 返回非零退出码: ${result.code}`,
        result.stdout ? `\n📝 输出:\n${result.stdout}` : '',
        result.stderr ? `\n⚠️ 错误输出:\n${result.stderr}` : '',
      ].filter(Boolean).join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 操作失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 关闭项目
 */
const weappClose = createTool<{ projectPath?: string }>(
  'weapp_close',
  '关闭微信小程序项目。可以关闭指定项目，或不指定项目路径时关闭当前活动项目。'
)
  .stringParam('projectPath', '项目路径（可选）。指定要关闭的小程序项目路径')
  .setHandler(async (args) => {
    const outputLines: string[] = ['🚪 关闭项目'];

    if (args.projectPath) {
      outputLines.push(`\n📁 项目路径: ${args.projectPath}`);
    }

    outputLines.push('🔄 正在尝试关闭...（可能需要多次尝试）\n');

    try {
      const result = await cliClient.close(args.projectPath, 3);

      if (result.success) {
        outputLines.push('✅ 项目关闭成功！');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}`);
        outputLines.push('注意: 关闭项目时会有 3 秒延迟，如果阻止弹窗未处理，项目将自动关闭');
      }

      if (result.stdout) {
        outputLines.push(`\n📝 输出:\n${result.stdout}`);
      }

      if (result.stderr) {
        outputLines.push(`\n⚠️ 错误输出:\n${result.stderr}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 关闭项目失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 退出工具
 */
const weappQuit = createTool(
  'weapp_quit',
  '完全退出微信开发者工具。此操作会关闭整个开发者工具进程，所有打开的项目都会被关闭。'
)
  .setHandler(async () => {
    const outputLines: string[] = ['🚪 退出微信开发者工具', '']; 

    try {
      outputLines.push('🔄 正在尝试关闭...（可能需要多次尝试）\n');

      const result = await cliClient.quit(3);

      if (result.success) {
        outputLines.push('✅ 开发者工具已退出！');
      } else {
        outputLines.push(`⚠️ CLI 命令返回非零退出码: ${result.code}`);
        outputLines.push('注意: 退出工具时会有 3 秒延迟，如果阻止弹窗未处理，工具将自动关闭');
      }

      if (result.stdout) {
        outputLines.push(`\n📝 输出:\n${result.stdout}`);
      }

      if (result.stderr) {
        outputLines.push(`\n⚠️ 错误输出:\n${result.stderr}`);
      }

      return text(outputLines.join('\n'), !result.success);
    } catch (error) {
      return text(`❌ 退出工具失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 重置文件监听
 */
const weappResetFileutils = createTool<{ projectPath?: string }>(
  'weapp_reset_fileutils',
  '重置微信开发者工具的文件监听。当文件监听出现异常或需要刷新文件状态时，可以使用此工具重置文件监听模块。'
)
  .stringParam('projectPath', '项目路径（可选）。指定要重置文件监听的项目路径')
  .wrapHandler({
    operation: '重置文件监听',
    executor: async (args) => {
      return cliClient.resetFileutils(args.projectPath);
    },
  })
  .build();

/**
 * 检测 HTTP 端口
 */
const weappHttpDetectPort = createTool(
  'weapp_http_detect_port',
  '检测微信开发者工具 HTTP 服务的端口号。从用户目录下的 .ide 文件中读取。'
)
  .setHandler(async () => {
    const outputLines: string[] = ['🔍 检测 HTTP 服务端口号', ''];

    try {
      const detection = await httpClient.detectHttpPort();

      if (detection.found && detection.port) {
        outputLines.push('✅ 检测到 HTTP 服务端口！\n');
        outputLines.push('📋 HTTP 服务信息:');
        outputLines.push(`   HTTP 端口: ${detection.port}`);
        outputLines.push(`   HTTP 服务地址: http://127.0.0.1:${detection.port}`);

        if (detection.ideFilePath) {
          outputLines.push(`\n📄 .ide 文件路径:`);
          outputLines.push(`   ${detection.ideFilePath}`);
        }

        // 测试 HTTP 服务是否可用
        outputLines.push(`\n🧪 测试 HTTP 服务连接...`);
        httpClient.setHttpPort(detection.port);
        const isAvailable = await httpClient.isAvailable();

        if (isAvailable) {
          outputLines.push('   ✅ HTTP 服务响应正常');
        } else {
          outputLines.push('   ⚠️ HTTP 服务未响应（服务可能正在启动中）');
        }
      } else {
        outputLines.push('❌ 未检测到 HTTP 服务端口\n');
        outputLines.push('可能原因:');
        outputLines.push('   1. 微信开发者工具未启动');
        outputLines.push('   2. 工具启动中，端口文件尚未写入');
        outputLines.push('   3. .ide 文件路径计算错误\n');

        if (detection.ideFilePath) {
          outputLines.push('📄 预期的 .ide 文件路径:');
          outputLines.push(`   ${detection.ideFilePath}`);
        }

        if (detection.error) {
          outputLines.push(`\n⚠️ 错误信息: ${detection.error}`);
        }
      }

      return text(outputLines.join('\n'), !detection.found);
    } catch (error) {
      return text(`❌ 检测失败: ${String(error)}`, true);
    }
  })
  .build();

/**
 * 项目管理工具数组
 */
export const projectTools: ToolDefinition[] = [
  weappOpenTool,
  weappOpenProject,
  weappOpenOther,
  weappClose,
  weappQuit,
  weappResetFileutils,
  weappHttpDetectPort,
];
