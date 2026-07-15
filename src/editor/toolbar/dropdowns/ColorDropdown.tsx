import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { Baseline } from "lucide-react";

const COLORS = [
  "#000000", "#444444", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff8a00", "#ffce00", "#39b54a", "#00a0e9", "#0052d9",
  "#7b49d8", "#e9539b", "#c7254e", "#8b4513", "#2f4f4f", "#556b2f",
];

export function ColorDropdown({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <Dropdown
      label=""
      width={36}
      panelMinWidth={168}
      icon={
        <span className="flex flex-col items-center leading-none">
          <Baseline size={15} className="text-ue-ink" />
          <span
            className="mt-0.5 h-1 w-4 rounded-sm"
            style={{ background: current || "#3b8cff" }}
          />
        </span>
      }
    >
      {(close) => (
        <div className="p-2">
          <div className="mb-1.5 text-[11px] text-ue-faint">文字颜色</div>
          <div className="grid grid-cols-6 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  close();
                }}
                className="h-5 w-5 rounded border border-ue-border transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              close();
            }}
            className="mt-2 w-full rounded px-2 py-1 text-left text-[12px] text-ue-sub hover:bg-ue-hover"
          >
            清除颜色
          </button>
        </div>
      )}
    </Dropdown>
  );
}
