import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { MenuItem } from "./MenuItem";

interface Option {
  label: string;
  level?: number; // undefined => 正文
  cmd: "paragraph" | "heading" | "blockquote" | "codeBlock";
}

const OPTIONS: Option[] = [
  { label: "正文", cmd: "paragraph" },
  { label: "标题 1", level: 1, cmd: "heading" },
  { label: "标题 2", level: 2, cmd: "heading" },
  { label: "标题 3", level: 3, cmd: "heading" },
  { label: "标题 4", level: 4, cmd: "heading" },
  { label: "标题 5", level: 5, cmd: "heading" },
  { label: "标题 6", level: 6, cmd: "heading" },
];

export function HeadingDropdown({ editor }: { editor: Editor }) {
  const current = OPTIONS.find((o) => {
    if (o.cmd === "paragraph") return editor.isActive("paragraph");
    if (o.cmd === "heading")
      return editor.isActive("heading", { level: o.level });
    return false;
  });
  const label = current?.label ?? "段落格式";

  return (
    <Dropdown label={label} width={120} panelMinWidth={140}>
      {(close) => (
        <div className="py-1">
          {OPTIONS.map((o) => {
            const active =
              o.cmd === "paragraph"
                ? editor.isActive("paragraph")
                : editor.isActive("heading", { level: o.level });
            return (
              <MenuItem
                key={o.label}
                label={o.label}
                active={active}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: o.level as 1 })
                    .run();
                  close();
                }}
              />
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}
