import type { EditorConfig } from "../types";

/** 错误上下文，便于调用方定位问题来源 */
export type ErrorContext =
  | "paste-image-upload"
  | "drop-image-upload"
  | "drop-file-upload"
  | "image-upload"
  | "file-upload"
  | "video-upload"
  | "audio-upload"
  | "music-upload"
  | "screenshot"
  | "remote-image"
  | "save-image"
  | "export";

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * 统一错误上报：优先调用 EditorConfig.onError，否则降级到 console.error。
 */
export function reportError(
  config: EditorConfig | undefined,
  context: ErrorContext,
  err: unknown,
): void {
  const error = toError(err);
  if (config?.onError) {
    try {
      config.onError(error, context);
      return;
    } catch {
      // onError 自身抛错时继续降级
    }
  }
  // 开发环境保留控制台输出，便于调试
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    return;
  }
  console.error(`[sEditor] ${context}:`, error);
}

/**
 * 普通警告日志，仅在非测试环境输出。
 */
export function logWarning(message: string): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    return;
  }
  console.warn(`[sEditor] ${message}`);
}
