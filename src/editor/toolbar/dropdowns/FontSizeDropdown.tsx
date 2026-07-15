import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { MenuItem } from "./MenuItem";

const SIZES: { label: string; value: string }[] = [
  { label: "默认", value: "" },
  { label: "12", value: "12px" },
  { label: "13", value: "13px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "48", value: "48px" },
];

export function FontSizeDropdown({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").fontSize as string | undefined;
  const matched = SIZES.find((s) => s.value === current);
  const label = matched ? matched.label : "字号";

  return (
    <Dropdown label={label} width={72} panelMinWidth={90}>
      {(close) => (
        <div className="py-1">
          {SIZES.map((s) => (
            <MenuItem
              key={s.label}
              label={s.label}
              active={!!current && s.value === current}
              onClick={() => {
                if (s.value) editor.chain().focus().setFontSize(s.value).run();
                else editor.chain().focus().unsetFontSize().run();
                close();
              }}
            />
          ))}
        </div>
      )}
    </Dropdown>
  );
}
