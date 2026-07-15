import type { Editor } from "@tiptap/core";
import { Dropdown } from "./Dropdown";
import { MenuItem } from "./MenuItem";

const FONTS: { label: string; value: string }[] = [
  { label: "默认", value: "" },
  { label: "宋体", value: "SimSun, STSong, serif" },
  { label: "黑体", value: "SimHei, STHeiti, sans-serif" },
  { label: "楷体", value: "KaiTi, STKaiti, serif" },
  { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
  { label: "仿宋", value: "FangSong, STFangsong, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Courier New", value: '"Courier New", monospace' },
];

export function FontFamilyDropdown({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").fontFamily as string | undefined;
  const matched = FONTS.find((f) => f.value === current);
  const label = matched && matched.value ? matched.label : "字体";

  return (
    <Dropdown label={label} width={120} panelMinWidth={150}>
      {(close) => (
        <div className="py-1">
          {FONTS.map((f) => (
            <MenuItem
              key={f.label}
              label={f.label}
              leading={
                f.value ? (
                  <span
                    className="text-[13px]"
                    style={{ fontFamily: f.value }}
                  >
                    Aa
                  </span>
                ) : null
              }
              active={!!current && f.value === current}
              onClick={() => {
                if (f.value) editor.chain().focus().setFontFamily(f.value).run();
                else editor.chain().focus().unsetFontFamily().run();
                close();
              }}
            />
          ))}
        </div>
      )}
    </Dropdown>
  );
}
