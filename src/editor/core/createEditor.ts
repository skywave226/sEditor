import type { EditorOptions } from "@tiptap/react";
import { buildExtensions } from "./extensions";

/**
 * 构建编辑器配置。返回 TipTap useEditor 所需的 options。
 */
export function createEditorOptions(
  initialContent?: string,
  onChange?: (html: string) => void,
): Partial<EditorOptions> {
  return {
    extensions: buildExtensions(),
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "ue-content",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  };
}
