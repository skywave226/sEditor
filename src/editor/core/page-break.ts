import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

/**
 * 分页符节点：渲染为带 page-break-after: always 的 div。
 * 在浏览器打印预览中会产生强制分页效果。
 */
export const PageBreak = Node.create({
  name: "pageBreak",

  group: "block",

  selectable: true,

  atom: true,

  parseHTML() {
    return [{ tag: "div[data-page-break]" }, { tag: "hr.page-break" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-page-break": "true",
        style: "page-break-after: always; clear: both;",
        ...HTMLAttributes,
      },
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name }).run(),
    };
  },
});
