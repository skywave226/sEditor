/**
 * 图片压缩工具测试
 *
 * jsdom 的 canvas 不支持 toBlob，因此通过 mock Image / canvas 来验证核心逻辑。
 */
import { describe, it, expect, vi } from "vitest";
import { compressImage, type CompressOptions } from "./image-utils";

describe("image-utils", () => {
  const createImageFile = (name: string, type: string, size = 1024): File =>
    new File([new Uint8Array(size)], name, { type, lastModified: Date.now() });

  function mockImage(naturalWidth: number, naturalHeight: number) {
    let onloadFn: (() => void) | undefined;
    let onerrorFn: (() => void) | undefined;
    const img = {} as Record<string, unknown>;

    Object.defineProperty(img, "naturalWidth", { value: naturalWidth });
    Object.defineProperty(img, "naturalHeight", { value: naturalHeight });
    Object.defineProperty(img, "onload", {
      set(fn: () => void) {
        onloadFn = fn;
      },
      get: () => onloadFn,
      configurable: true,
    });
    Object.defineProperty(img, "onerror", {
      set(fn: () => void) {
        onerrorFn = fn;
      },
      get: () => onerrorFn,
      configurable: true,
    });
    Object.defineProperty(img, "src", {
      set(url: string) {
        // 同步触发，避免 vitest 中 setTimeout 与微任务交织导致超时
        queueMicrotask(() => {
          if (url === "error") {
            onerrorFn?.();
          } else {
            onloadFn?.();
          }
        });
      },
      configurable: true,
    });
    Object.defineProperty(img, "addEventListener", {
      value: () => undefined,
      configurable: true,
    });

    return img as unknown as HTMLImageElement;
  }

  function mockCanvas() {
    let drawn: { img: unknown; sx: number; sy: number; sw: number; sh: number } | null = null;
    return {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: (img: unknown, sx: number, sy: number, sw: number, sh: number) => {
          drawn = { img, sx, sy, sw, sh };
        },
      }),
      toBlob: (
        cb: (blob: Blob | null) => void,
        type?: string,
      ) => {
        // 模拟压缩后的 blob，大小为 512（小于原图 1024）
        cb(new Blob([new Uint8Array(512)], { type: type ?? "image/jpeg" }));
      },
      _drawn: () => drawn,
    };
  }

  it("非图片文件直接返回原文件", async () => {
    const file = createImageFile("a.txt", "text/plain");
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("尺寸未超限且输出类型一致时直接返回原文件", async () => {
    const file = createImageFile("small.jpg", "image/jpeg");
    const img = mockImage(100, 100);
    const canvas = mockCanvas();

    vi.stubGlobal("Image", vi.fn(() => img));
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    } as unknown as Document);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:small"),
      revokeObjectURL: vi.fn(),
    });

    const result = await compressImage(file);
    expect(result).toBe(file);

    vi.unstubAllGlobals();
  });

  it("尺寸超限且输出类型不同则压缩并返回新文件", async () => {
    const file = createImageFile("big.png", "image/png");
    const img = mockImage(3000, 3000);
    const canvas = mockCanvas();

    vi.stubGlobal("Image", vi.fn(() => img));
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    } as unknown as Document);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:big"),
      revokeObjectURL: vi.fn(),
    });

    const result = await compressImage(file);
    expect(result).not.toBe(file);
    expect(result.type).toBe("image/png");
    expect(result.name).toMatch(/\.png$/);
    expect(canvas._drawn()?.sw).toBe(1920);

    vi.unstubAllGlobals();
  });

  it("自定义压缩参数生效", async () => {
    const file = createImageFile("huge.jpg", "image/jpeg");
    const img = mockImage(4000, 2000);
    const canvas = mockCanvas();

    vi.stubGlobal("Image", vi.fn(() => img));
    vi.stubGlobal("document", {
      createElement: vi.fn(() => canvas),
    } as unknown as Document);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:huge"),
      revokeObjectURL: vi.fn(),
    });

    const opts: CompressOptions = { maxWidth: 800, maxHeight: 600, quality: 0.5, type: "image/webp" };
    const result = await compressImage(file, opts);
    expect(result.type).toBe("image/webp");
    expect(result.name).toMatch(/\.webp$/);
    expect(canvas._drawn()?.sw).toBe(800);

    vi.unstubAllGlobals();
  });

  it("图片加载失败时 reject", async () => {
    const file = createImageFile("fail.jpg", "image/jpeg");
    const img = mockImage(100, 100);

    vi.stubGlobal("Image", vi.fn(() => img));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "error"),
      revokeObjectURL: vi.fn(),
    });

    await expect(compressImage(file)).rejects.toThrow("图片加载失败，无法压缩");

    vi.unstubAllGlobals();
  });
});
