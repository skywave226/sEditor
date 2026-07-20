import { Mark } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    superscript: {
      toggleSuperscript: () => ReturnType;
    };
  }
}

/**
 * 上标：渲染为 <sup>
 */
export const Superscript = Mark.create({
  name: "superscript",

  parseHTML() {
    return [{ tag: "sup" }, { style: "vertical-align: super" }];
  },

  renderHTML() {
    return ["sup", 0];
  },

  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ chain }): boolean =>
          chain().toggleMark(this.name).run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-.": () => this.editor.commands.toggleSuperscript(),
    };
  },
});
