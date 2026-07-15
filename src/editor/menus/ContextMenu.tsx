import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorStore } from "../store";
import { MenuItem } from "../toolbar/dropdowns/MenuItem";

interface ContextMenuProps {
  editor: Editor;
}

export function ContextMenu({ editor }: ContextMenuProps) {
  const menu = useEditorStore((s) => s.contextMenu);
  const close = useEditorStore((s) => s.closeContextMenu);
  const openDialog = useEditorStore((s) => s.openDialog);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = () => close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", close, true);
    };
  }, [menu, close]);

  if (!menu) return null;

  const inTable = editor.isActive("table");
  const inCell = editor.isActive("tableCell") || editor.isActive("tableHeader");
  const inLink = editor.isActive("link");

  const run = (fn: () => void) => {
    fn();
    close();
  };

  return (
    <div
      ref={ref}
      className="fixed z-[200] min-w-[160px] rounded-md border border-ue-border bg-white py-1 shadow-panel"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MenuItem
        label="剪切"
        onClick={() =>
          run(() => document.execCommand("cut"))
        }
      />
      <MenuItem
        label="复制"
        onClick={() => run(() => document.execCommand("copy"))}
      />
      <MenuItem
        label="粘贴"
        onClick={() => run(() => editor.chain().focus().run())}
      />
      <div className="my-1 h-px bg-ue-divider" />
      <MenuItem
        label="全选"
        onClick={() => run(() => editor.chain().focus().selectAll().run())}
      />

      {inLink && (
        <>
          <div className="my-1 h-px bg-ue-divider" />
          <MenuItem label="编辑链接" onClick={() => run(() => openDialog("link"))} />
          <MenuItem
            label="取消链接"
            onClick={() => run(() => editor.chain().focus().unsetLink().run())}
          />
        </>
      )}

      {inTable && inCell && (
        <>
          <div className="my-1 h-px bg-ue-divider" />
          <MenuItem label="上方插入行" onClick={() => run(() => editor.chain().focus().addRowBefore().run())} />
          <MenuItem label="下方插入行" onClick={() => run(() => editor.chain().focus().addRowAfter().run())} />
          <MenuItem label="左侧插入列" onClick={() => run(() => editor.chain().focus().addColumnBefore().run())} />
          <MenuItem label="右侧插入列" onClick={() => run(() => editor.chain().focus().addColumnAfter().run())} />
          <div className="my-1 h-px bg-ue-divider" />
          <MenuItem label="删除行" onClick={() => run(() => editor.chain().focus().deleteRow().run())} />
          <MenuItem label="删除列" onClick={() => run(() => editor.chain().focus().deleteColumn().run())} />
          <MenuItem label="合并单元格" onClick={() => run(() => editor.chain().focus().mergeCells().run())} />
          <MenuItem label="拆分单元格" onClick={() => run(() => editor.chain().focus().splitCell().run())} />
          <MenuItem label="删除表格" onClick={() => run(() => editor.chain().focus().deleteTable().run())} />
        </>
      )}
    </div>
  );
}
