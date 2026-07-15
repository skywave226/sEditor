import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { Dialog } from "./Dialog";
import { commandRegistry } from "../commands/registry";
import { useEditorStore } from "../store";

const GROUPS: { name: string; chars: string[] }[] = [
  {
    name: "常用",
    chars: ["、", "。", "，", "；", "：", "？", "！", "「", "」", "『", "』", "〈", "〉", "《", "》", "【", "】", "〔", "〕", "—", "…", "·", "～"],
  },
  {
    name: "数学",
    chars: ["±", "×", "÷", "∈", "∏", "∑", "√", "∝", "∞", "∟", "∠", "∥", "∧", "∨", "∩", "∪", "∫", "∮", "≠", "≤", "≥", "≡", "≈", "⊕"],
  },
  {
    name: "单位",
    chars: ["℃", "℉", "‰", "′", "″", "§", "№", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼"],
  },
  {
    name: "箭头",
    chars: ["←", "↑", "→", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "⇐", "⇒", "⇔"],
  },
  {
    name: "希腊",
    chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "ψ", "ω", "Δ", "Σ", "Ω"],
  },
];

export function SpecialCharDialog({ editor }: { editor: Editor }) {
  const closeDialog = useEditorStore((s) => s.closeDialog);
  const [group, setGroup] = useState(0);

  useEffect(() => {
    return () => {
      editor.commands.focus();
    };
  }, [editor]);

  const insert = (ch: string) => {
    commandRegistry.run(editor, "specialChar", ch);
  };

  return (
    <Dialog title="特殊字符" width={420} onClose={closeDialog} onCancel={closeDialog}>
      <div className="mb-2 flex flex-wrap gap-1">
        {GROUPS.map((g, i) => (
          <button
            key={g.name}
            type="button"
            onClick={() => setGroup(i)}
            className={
              "rounded px-2 py-1 text-[12px] " +
              (group === i ? "bg-ue-primary text-white" : "text-ue-sub hover:bg-ue-hover")
            }
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {GROUPS[group].chars.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => insert(c)}
            className="flex h-8 items-center justify-center rounded border border-ue-border text-[16px] text-ue-ink hover:border-ue-primary hover:bg-ue-active"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 text-[12px] text-ue-faint">点击字符插入，可连续插入多个。</div>
    </Dialog>
  );
}
