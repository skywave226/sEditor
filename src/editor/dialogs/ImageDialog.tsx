import { useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { Dialog, Field, inputClass } from "./Dialog";
import { commandRegistry } from "../commands/registry";
import { useEditorStore } from "../store";
import type { EditorConfig } from "../types";

export function ImageDialog({
  editor,
  config,
}: {
  editor: Editor;
  config?: EditorConfig;
}) {
  const closeDialog = useEditorStore((s) => s.closeDialog);
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [width, setWidth] = useState("");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const confirm = () => {
    const url = src.trim();
    if (!url) return;
    const opts: Record<string, unknown> = { src: url };
    if (alt) opts.alt = alt;
    if (width) opts.width = width;
    commandRegistry.run(editor, "image", opts);
    if (align === "center" || align === "right" || align === "left") {
      editor.chain().focus().setTextAlign(align).run();
    }
    closeDialog();
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    if (!config?.imageUpload) {
      setError("未配置上传能力，请使用 URL 插入。");
      return;
    }
    setUploading(true);
    try {
      const url = await config.imageUpload(file);
      setSrc(url);
      setTab("url");
    } catch {
      setError("上传失败，请重试。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      title="插入图片"
      width={460}
      onClose={closeDialog}
      onCancel={closeDialog}
      onConfirm={confirm}
      confirmDisabled={!src.trim()}
    >
      {config?.imageUpload && (
        <div className="mb-3 flex border-b border-ue-border text-[13px]">
          {(["url", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "px-3 py-1.5 " +
                (tab === t
                  ? "border-b-2 border-ue-primary text-ue-primary-text"
                  : "text-ue-sub")
              }
            >
              {t === "url" ? "网络图片" : "本地上传"}
            </button>
          ))}
        </div>
      )}

      {tab === "upload" && (
        <Field label="选择文件">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="text-[12px] text-ue-sub"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading && <div className="mt-1 text-[12px] text-ue-primary">上传中…</div>}
          {error && <div className="mt-1 text-[12px] text-red-500">{error}</div>}
        </Field>
      )}

      {tab === "url" && (
        <Field label="图片地址">
          <input
            className={inputClass}
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="https://"
            autoFocus
          />
        </Field>
      )}

      <Field label="替代文本">
        <input
          className={inputClass}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="（可选）"
        />
      </Field>
      <Field label="宽度（px 或 %）">
        <input
          className={inputClass}
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          placeholder="如 400 或 100%"
        />
      </Field>
      <Field label="对齐方式">
        <div className="flex gap-4 text-[13px] text-ue-ink">
          {(["left", "center", "right"] as const).map((a) => (
            <label key={a} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="align"
                checked={align === a}
                onChange={() => setAlign(a)}
              />
              {a === "left" ? "左对齐" : a === "center" ? "居中" : "右对齐"}
            </label>
          ))}
        </div>
      </Field>
    </Dialog>
  );
}
