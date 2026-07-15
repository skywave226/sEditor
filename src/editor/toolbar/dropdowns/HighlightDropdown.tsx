import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { Highlighter } from "lucide-react";

const COLORS = [
  "transparent", "#ffff00", "#ffce00", "#ff8a00", "#ff0000", "#ff69b4",
  "#39b54a", "#00a0e9", "#0052d9", "#7b49d8", "#e9539b", "#cccccc",
];

export function HighlightDropdown({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("highlight").color as string | undefined;
  const active = editor.isActive("highlight");

  return (
    <Dropdown
      label=""
      width={36}
      panelMinWidth={168}
      icon={
        <span className="flex flex-col items-center leading-none">
          <Highlighter size={15} className="text-ue-ink" />
          <span
            className="mt-0.5 h-1 w-4 rounded-sm"
            style={{ background: active ? current || "#ffff00" : "#c0c4cc" }}
          />
        </span>
      }
    >
      {(close) => (
        <div className="p-2">
          <div className="mb-1.5 text-[11px] text-ue-faint">背景颜色</div>
          <div className="grid grid-cols-6 gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c === "transparent" ? "无" : c}
                onClick={() => {
                  if (c === "transparent") editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color: c }).run();
                  close();
                }}
                className="h-5 w-5 rounded border border-ue-border transition-transform hover:scale-110"
                style={{
                  background:
                    c === "transparent"
                      ? "linear-gradient(45deg,#fff 45%,#e9539b 45%,#e9539b 55%,#fff 55%)"
                      : c,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              close();
            }}
            className="mt-2 w-full rounded px-2 py-1 text-left text-[12px] text-ue-sub hover:bg-ue-hover"
          >
            清除背景
          </button>
        </div>
      )}
    </Dropdown>
  );
}
