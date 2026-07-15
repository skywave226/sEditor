import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { Dialog, Field, inputClass } from "./Dialog";
import { commandRegistry } from "../commands/registry";
import { useEditorStore } from "../store";

export function TableDialog({ editor }: { editor: Editor }) {
  const closeDialog = useEditorStore((s) => s.closeDialog);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeader, setWithHeader] = useState(true);

  const confirm = () => {
    commandRegistry.run(editor, "table", {
      rows: Math.max(1, rows),
      cols: Math.max(1, cols),
      withHeader,
    });
    closeDialog();
  };

  return (
    <Dialog
      title="插入表格"
      width={400}
      onClose={closeDialog}
      onCancel={closeDialog}
      onConfirm={confirm}
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <Field label="行数">
            <input
              type="number"
              min={1}
              max={20}
              className={inputClass}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="列数">
            <input
              type="number"
              min={1}
              max={10}
              className={inputClass}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>
      <Field label="表头">
        <label className="flex items-center gap-1.5 text-[13px] text-ue-ink">
          <input
            type="checkbox"
            checked={withHeader}
            onChange={(e) => setWithHeader(e.target.checked)}
          />
          包含表头行
        </label>
      </Field>
    </Dialog>
  );
}
