/**
 * 图片工具：上传前基于 canvas 的等比压缩。
 *
 * - 仅当实际尺寸超过 maxWidth/maxHeight 时才缩放；否则只进行质量压缩。
 * - 返回 Blob 后再包装为 File，保留原文件名（扩展名会随 mime 变化）。
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: "image/jpeg" | "image/webp";
}

function getCompressType(file: File, opts: CompressOptions): string {
  if (opts.type) return opts.type;
  // 透明通道图片优先保持 png，避免压缩后背景变黑
  if (file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp") {
    return "image/png";
  }
  return "image/jpeg";
}

/**
 * 使用 canvas 压缩图片。
 * @returns 压缩后的 File（可能仍等于原文件，若无需缩放且 type 相同）
 */
export function compressImage(file: File, options?: CompressOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const opts = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      ...options,
    };

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = calculateSize(img.naturalWidth, img.naturalHeight, opts.maxWidth, opts.maxHeight);
      const outputType = getCompressType(file, options ?? {});

      // 尺寸未超限且输出类型与原类型一致：直接返回原文件，避免有损重编码
      if (width === img.naturalWidth && height === img.naturalHeight && outputType === file.type) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const ext = outputType === "image/webp" ? "webp" : outputType === "image/png" ? "png" : "jpg";
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
          resolve(new File([blob], name, { type: outputType, lastModified: file.lastModified }));
        },
        outputType,
        opts.quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败，无法压缩"));
    };

    img.src = url;
  });
}

function calculateSize(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  let width = srcWidth;
  let height = srcHeight;
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);
  return { width, height };
}
