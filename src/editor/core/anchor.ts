import { Node } from "@tiptap/core";

export interface AnchorOptions {
  id: string;
  name?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    anchor: {
      insertAnchor: (options: AnchorOptions) => ReturnType;
    };
  }
}

/**
 * 锚点节点：作为文档内书签目标。
 * 渲染为带 id 的 <a> 标签，默认 inline 显示一个小锚点图标占位。
 */
export const Anchor = Node.create({
  name: "anchor",

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      name: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "a[name]" }, { tag: "a[id]" }, { tag: "span[data-anchor]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        ...HTMLAttributes,
        "data-anchor": "true",
        style: "display: inline-block; width: 16px; height: 16px; vertical-align: middle; margin: 0 2px; border-radius: 2px; background: #f59e0b; color: #fff; font-size: 10px; line-height: 16px; text-align: center; text-decoration: none; cursor: default;",
        title: HTMLAttributes.name || HTMLAttributes.id || "锚点",
      },
      "⚓",
    ];
  },

  addCommands() {
    return {
      insertAnchor:
        (options) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: options }).run(),
    };
  },
});
