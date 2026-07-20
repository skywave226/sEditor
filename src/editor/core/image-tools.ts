/**
 * 图片工具：本地保存、远程抓取等通用能力。
 */

/** 将图片地址（含 dataURL）转换为 Blob */
export async function imageSrcToBlob(src: string): Promise<Blob | null> {
  if (src.startsWith("data:")) {
    try {
      const res = await fetch(src);
      return res.ok ? res.blob() : null;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(src, { mode: "cors" });
    return res.ok ? res.blob() : null;
  } catch {
    return null;
  }
}

/** 触发浏览器下载 Blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 远程图片地址转 dataURL（受 CORS 限制） */
export async function urlToDataUrl(src: string): Promise<string | null> {
  const blob = await imageSrcToBlob(src);
  if (!blob) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
