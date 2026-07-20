import { Mark } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subscript: {
      toggleSubscript: () => ReturnType;
    };
  }
}

/**
 * 下标：渲染为 <sub>
 */
export const Subscript = Mark.create({
  name: "subscript",

  parseHTML() {
    return [{ tag: "sub" }, { style: "vertical-align: sub" }];
  },

  renderHTML() {
    return ["sub", 0];
  },

  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ chain }): boolean =>
          chain().toggleMark(this.name).run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-,": () => this.editor.commands.toggleSubscript(),
    };
  },
});
