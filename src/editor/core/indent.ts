import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export interface IndentOptions {
  types: string[];
  step: number;
  max: number;
}

const STEP = 2; // em

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      step: STEP,
      max: STEP * 5,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            // 仅识别 em 单位的缩进，避免把粘贴的 padding-left: 32px 误判为 16 级缩进
            parseHTML: (el) => {
              const pad = (el as HTMLElement).style.paddingLeft;
              if (!pad) return 0;
              const m = pad.match(/^([\d.]+)em$/);
              if (!m) return 0;
              return Math.round(parseFloat(m[1]) / STEP);
            },
            renderHTML: (attrs) => {
              if (!attrs.indent) return {};
              return { style: `padding-left: ${attrs.indent * STEP}em` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ commands, editor }) => {
          // 根据光标所在节点类型读取 indent，避免标题中误读段落的 indent
          const parentType = editor.state.selection.$from.parent.type.name;
          const cur = (editor.getAttributes(parentType).indent || 0) as number;
          const next = Math.min(cur + 1, Math.round(this.options.max / STEP));
          return this.options.types.every((t) => commands.updateAttributes(t, { indent: next }));
        },
      outdent:
        () =>
        ({ commands, editor }) => {
          const parentType = editor.state.selection.$from.parent.type.name;
          const cur = (editor.getAttributes(parentType).indent || 0) as number;
          const next = Math.max(cur - 1, 0);
          return this.options.types.every((t) => commands.updateAttributes(t, { indent: next }));
        },
    };
  },
});
