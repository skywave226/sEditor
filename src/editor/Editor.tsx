import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { Toolbar } from "./toolbar/Toolbar";
import { EditorFrame } from "./editor-frame/EditorFrame";
import { StatusBar } from "./status-bar/StatusBar";
import { ContextMenu } from "./menus/ContextMenu";
import { LinkDialog } from "./dialogs/LinkDialog";
import { ImageDialog } from "./dialogs/ImageDialog";
import { TableDialog } from "./dialogs/TableDialog";
import { SpecialCharDialog } from "./dialogs/SpecialCharDialog";
import { createEditorOptions } from "./core/createEditor";
import { ensureCommandsRegistered } from "./commands/definitions";
import { useEditorStore } from "./store";
import type { EditorConfig } from "./types";
import { cn } from "@/lib/utils";

ensureCommandsRegistered();

interface EditorProps {
  config?: EditorConfig;
}

export function RichEditor({ config }: EditorProps) {
  const editor = useEditor(
    createEditorOptions(config?.initialContent, config?.onChange),
    [],
  );

  const isFullscreen = useEditorStore((s) => s.isFullscreen);
  const activeDialog = useEditorStore((s) => s.activeDialog);
  const openContextMenu = useEditorStore((s) => s.openContextMenu);

  // ESC 退出全屏
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useEditorStore.getState().setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-ue-border bg-white shadow-sm",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-0",
      )}
      style={isFullscreen ? undefined : { height: "auto" }}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY);
      }}
    >
      <Toolbar editor={editor} />
      <EditorFrame editor={editor} height={config?.height} />
      <StatusBar editor={editor} />

      <ContextMenu editor={editor} />

      {activeDialog === "link" && <LinkDialog editor={editor} />}
      {activeDialog === "image" && <ImageDialog editor={editor} config={config} />}
      {activeDialog === "table" && <TableDialog editor={editor} />}
      {activeDialog === "specialChar" && <SpecialCharDialog editor={editor} />}
    </div>
  );
}

export default RichEditor;
