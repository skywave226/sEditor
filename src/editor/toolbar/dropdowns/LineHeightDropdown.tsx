import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { MenuItem } from "./MenuItem";

const OPTIONS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "1.75", value: "1.75" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

export function LineHeightDropdown({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("paragraph").lineHeight as string | undefined;
  const matched = OPTIONS.find((o) => o.value === current);
  const label = matched ? matched.label : "行距";

  return (
    <Dropdown label={label} width={72} panelMinWidth={90}>
      {(close) => (
        <div className="py-1">
          {OPTIONS.map((o) => (
            <MenuItem
              key={o.value}
              label={o.label}
              active={!!current && o.value === current}
              onClick={() => {
                editor.chain().focus().setLineHeight(o.value).run();
                close();
              }}
            />
          ))}
        </div>
      )}
    </Dropdown>
  );
}
