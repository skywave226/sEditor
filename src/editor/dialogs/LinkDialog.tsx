import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { Dialog, Field, inputClass } from "./Dialog";
import { commandRegistry } from "../commands/registry";
import { useEditorStore } from "../store";

export function LinkDialog({ editor }: { editor: Editor }) {
  const closeDialog = useEditorStore((s) => s.closeDialog);
  const [href, setHref] = useState("");
  const [text, setText] = useState("");
  const [target, setTarget] = useState("_blank");

  useEffect(() => {
    const prev = editor.getAttributes("link");
    setHref(prev.href ?? "");
    setTarget(prev.target ?? "_blank");
    const { from, to, empty } = editor.state.selection;
    if (!empty) setText(editor.state.doc.textBetween(from, to, " "));
    else setText("");
  }, [editor]);

  const confirm = () => {
    const url = href.trim();
    if (!url) return;
    // 如有选中文本且与默认不同，先替换文本再设置链接
    if (text && editor.state.selection.empty) {
      editor.chain().focus().insertContent(text).run();
    }
    commandRegistry.run(editor, "link", {
      href: url,
      target: target === "_blank" ? "_blank" : "_self",
    });
    closeDialog();
  };

  return (
    <Dialog
      title="超链接"
      width={440}
      onClose={closeDialog}
      onCancel={closeDialog}
      onConfirm={confirm}
      confirmDisabled={!href.trim()}
    >
      <Field label="链接地址">
        <input
          className={inputClass}
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://"
          autoFocus
        />
      </Field>
      <Field label="链接文本">
        <input
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="（可选）"
        />
      </Field>
      <Field label="打开方式">
        <div className="flex gap-4 text-[13px] text-ue-ink">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="target"
              checked={target === "_blank"}
              onChange={() => setTarget("_blank")}
            />
            新窗口
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="target"
              checked={target === "_self"}
              onChange={() => setTarget("_self")}
            />
            当前窗口
          </label>
        </div>
      </Field>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={() => {
            commandRegistry.run(editor, "link", { href: "" });
            closeDialog();
          }}
          className="text-[12px] text-ue-primary hover:underline"
        >
          取消已有链接
        </button>
      )}
    </Dialog>
  );
}
