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
            parseHTML: (el) => {
              const pad = parseInt((el as HTMLElement).style.paddingLeft || "0", 10);
              return Number.isNaN(pad) ? 0 : Math.round(pad / STEP);
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
          const cur = (editor.getAttributes("paragraph").indent || 0) as number;
          const next = Math.min(cur + 1, Math.round(this.options.max / STEP));
          return this.options.types.every((t) => commands.updateAttributes(t, { indent: next }));
        },
      outdent:
        () =>
        ({ commands, editor }) => {
          const cur = (editor.getAttributes("paragraph").indent || 0) as number;
          const next = Math.max(cur - 1, 0);
          return this.options.types.every((t) => commands.updateAttributes(t, { indent: next }));
        },
    };
  },
});
