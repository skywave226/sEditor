import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { SourceView } from "../views/SourceView";
import { useEditorStore } from "../store";
import { cn } from "@/lib/utils";

interface EditorFrameProps {
  editor: Editor;
  height?: number | string;
}

export function EditorFrame({ editor, height }: EditorFrameProps) {
  const isSourceMode = useEditorStore((s) => s.isSourceMode);

  return (
    <div
      className={cn(
        "relative flex-1 overflow-auto bg-white",
        !isSourceMode && "ue-frame-focus",
      )}
      style={{ minHeight: height ?? 300 }}
    >
      {isSourceMode ? (
        <SourceView editor={editor} />
      ) : (
        <div className="px-4 py-3">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
