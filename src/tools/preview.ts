/**
 * 预览和上传工具模块
 */
import { cliClient } from '../cli-client.js';
import { ToolDefinition } from '../types.js';
import { isValidProjectPath, isValidVersion } from '../utils/helpers.js';
import { createTool, createToolHandler } from '../utils/tool-wrapper.js';
import { text } from '../utils/result-formatter.js';

/**
 * 预览工具
 */
const weappPreview = createTool<{
  project: string;
  qrFormat?: 'terminal' | 'image' | 'base64';
  qrOutput?: string;
  infoOutput?: string;
}>('weapp_preview', '生成微信小程序预览二维码，用于在真机上预览小程序效果')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .stringParam('qrFormat', '二维码格式：terminal(终端输出)、image(图片文件)、base64(Base64编码)', {
    enum: ['terminal', 'image', 'base64'],
    default: 'terminal',
  })
  .stringParam('qrOutput', '二维码图片输出路径（当 qrFormat 为 image 时使用）')
  .stringParam('infoOutput', '预览信息输出文件路径（JSON格式）')
  .wrapHandler({
    operation: '生成预览二维码',
    executor: async (args) => {
      return cliClient.preview(
        args.project,
        args.qrFormat || 'terminal',
        args.qrOutput,
        args.infoOutput
      );
    },
    validator: (args) => {
      if (!isValidProjectPath(args.project)) {
        return {
          valid: false,
          error: text(
            `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
            true
          ),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 自动预览工具
 */
const weappAutoPreview = createTool<{
  project: string;
  infoOutput?: string;
}>('weapp_auto_preview', '自动预览小程序，将自动打开微信开发者工具并生成预览二维码')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .stringParam('infoOutput', '预览信息输出文件路径（JSON格式）')
  .wrapHandler({
    operation: '自动预览',
    executor: async (args) => {
      return cliClient.autoPreview(args.project, args.infoOutput);
    },
    validator: (args) => {
      if (!isValidProjectPath(args.project)) {
        return {
          valid: false,
          error: text(
            `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
            true
          ),
        };
      }
      return { valid: true };
    },
  })
  .build();

/**
 * 上传工具
 */
const weappUpload = createTool<{
  project: string;
  version: string;
  desc: string;
  infoOutput?: string;
}>('weapp_upload', '上传微信小程序代码到微信公众平台，用于提交审核或发布体验版')
  .stringParam('project', '小程序项目路径，必须是包含 project.config.json 的目录', { required: true })
  .stringParam('version', '版本号，格式为 x.y.z（如 1.0.0）', { required: true })
  .stringParam('desc', '版本描述信息，将在微信公众平台显示', { required: true })
  .stringParam('infoOutput', '上传信息输出文件路径（JSON格式）')
  .wrapHandler({
    operation: '上传代码',
    executor: async (args) => {
      return cliClient.upload(args.project, args.version, args.desc, args.infoOutput);
    },
    validator: (args) => {
      if (!isValidProjectPath(args.project)) {
        return {
          valid: false,
          error: text(
            `错误: 无效的项目路径: ${args.project}\n请确保路径存在且包含 project.config.json 文件。`,
            true
          ),
        };
      }

      if (!isValidVersion(args.version)) {
        return {
          valid: false,
          error: text(
            `错误: 无效的版本号格式: ${args.version}\n版本号必须使用 x.y.z 格式（如 1.0.0）。`,
            true
          ),
        };
      }

      if (!args.desc || args.desc.trim().length === 0) {
        return {
          valid: false,
          error: text('错误: 版本描述不能为空。', true),
        };
      }

      return { valid: true };
    },
  })
  .build();

/**
 * 工具定义数组
 */
export const previewTools: ToolDefinition[] = [weappPreview, weappAutoPreview, weappUpload];
