import { Node } from "@tiptap/core";

export interface IframeOptions {
  src: string;
  width?: string | number;
  height?: string | number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    iframe: {
      insertIframe: (options: IframeOptions) => ReturnType;
    };
  }
}

/**
 * iframe 嵌入节点：渲染为 <iframe>。
 */
export const Iframe = Node.create({
  name: "iframe",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100%",
      },
      height: {
        default: "300",
      },
    };
  },

  parseHTML() {
    return [{ tag: "iframe" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { style: "max-width: 100%;" },
      ["iframe", { ...HTMLAttributes, style: "max-width: 100%; border: 1px solid #e5e7eb;" }],
    ];
  },

  addCommands() {
    return {
      insertIframe:
        (options) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: options }).run(),
    };
  },
});
