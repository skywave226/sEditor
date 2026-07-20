import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: "ltr" | "rtl") => ReturnType;
      unsetTextDirection: () => ReturnType;
    };
  }
}

export interface TextDirectionOptions {
  types: string[];
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).getAttribute("dir") || null,
            renderHTML: (attrs) => {
              if (!attrs.dir) return {};
              return { dir: attrs.dir as string };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction) =>
        ({ commands }) =>
          this.options.types.every((t) => commands.updateAttributes(t, { dir: direction })),
      unsetTextDirection:
        () =>
        ({ commands }) =>
          this.options.types.every((t) => commands.resetAttributes(t, "dir")),
    };
  },
});
