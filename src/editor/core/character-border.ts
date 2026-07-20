import { Mark } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    characterBorder: {
      toggleCharacterBorder: () => ReturnType;
    };
  }
}

/**
 * 字符边框：给选中文本加 1px 实线边框。
 */
export const CharacterBorder = Mark.create({
  name: "characterBorder",

  parseHTML() {
    return [{ style: "border:1px solid" }, { style: "border: 1px solid" }];
  },

  renderHTML() {
    return [
      "span",
      {
        style: "border: 1px solid currentColor; padding: 0 2px; border-radius: 2px;",
      },
      0,
    ];
  },

  addCommands() {
    return {
      toggleCharacterBorder:
        () =>
        ({ chain }) =>
          chain().toggleMark(this.name).run(),
    };
  },
});
