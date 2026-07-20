/**
 * 全局常量配置，避免各模块中散落魔法数字。
 */

/** 默认单张图片最大字节数：5MB */
export const DEFAULT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

/** 默认单个文件最大字节数：20MB */
export const DEFAULT_FILE_MAX_SIZE = 20 * 1024 * 1024;

/** 默认草稿自动保存间隔：3 秒 */
export const DEFAULT_DRAFT_INTERVAL = 3000;

/** 默认阅读速度：300 字/分钟 */
export const DEFAULT_READING_SPEED = 300;

/** 默认对话框宽度 */
export const DIALOG_WIDTH = {
  link: 440,
  image: 460,
  file: 460,
  table: 400,
  specialChar: 420,
  video: 460,
  audio: 440,
  emoji: 420,
  findReplace: 440,
  iframe: 440,
  anchor: 420,
  music: 460,
  chart: 460,
  graffiti: 660,
  remoteImage: 440,
} as const;

/** 图表默认尺寸 */
export const CHART_DEFAULTS = {
  width: 420,
  height: 260,
  pad: { top: 32, right: 24, bottom: 48, left: 48 },
} as const;
