import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

/**
 * 订阅编辑器选区/事务变化，触发组件重渲染。
 * 调用后即可在组件中安全读取 editor.isActive(...) 等响应式状态。
 */
export function useEditorState(editor: Editor | null): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    editor.on("update", handler);
    editor.on("focus", handler);
    editor.on("blur", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
      editor.off("update", handler);
      editor.off("focus", handler);
      editor.off("blur", handler);
    };
  }, [editor]);
}
