import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorStore } from "../store";

/**
 * 源码模式：将编辑器内容以 HTML 源码形式展示与编辑，切换回所见即所得时双向同步。
 */
export function SourceView({ editor }: { editor: Editor }) {
  const isSourceMode = useEditorStore((s) => s.isSourceMode);
  const setSourceMode = useEditorStore((s) => s.setSourceMode);
  const [value, setValue] = useState("");
  const wasOn = useRef(false);

  // 进入源码模式：读取当前 HTML
  useEffect(() => {
    if (isSourceMode && !wasOn.current) {
      setValue(editor.getHTML());
      wasOn.current = true;
    }
    // 退出源码模式：写回 HTML
    if (!isSourceMode && wasOn.current) {
      editor.commands.setContent(value, false);
      wasOn.current = false;
    }
  }, [isSourceMode, editor, value]);

  if (!isSourceMode) return null;

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      spellCheck={false}
      className="ue-content h-full w-full resize-none border-0 bg-white p-4 font-mono text-[13px] text-ue-ink outline-none"
      style={{ fontFamily: '"SFMono-Regular", Consolas, monospace' }}
    />
  );
}
