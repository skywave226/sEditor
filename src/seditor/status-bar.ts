import type { Editor } from "@tiptap/core";
import { h } from "./dom";
import type { WordCount } from "../editor/types";

function computeWordCount(editor: Editor): WordCount {
  const text = editor.getText();
  const chars = text.length;
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  return { chars, words: cn + en };
}

function blockLabel(editor: Editor): string[] {
  const path: string[] = [];
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const name = node.type.name;
    let label = "";
    switch (name) {
      case "paragraph": label = "正文"; break;
      case "heading": label = `标题 ${node.attrs.level}`; break;
      case "blockquote": label = "引用"; break;
      case "codeBlock": label = "代码块"; break;
      case "bulletList": label = "无序列表"; break;
      case "orderedList": label = "有序列表"; break;
      case "listItem": label = "列表项"; break;
      case "table": label = "表格"; break;
      case "tableRow": label = "行"; break;
      case "tableCell": label = "单元格"; break;
      case "tableHeader": label = "表头"; break;
      default: label = name;
    }
    if (label) path.push(label);
  }
  path.reverse();
  const marks: string[] = [];
  if (editor.isActive("bold")) marks.push("加粗");
  if (editor.isActive("italic")) marks.push("斜体");
  if (editor.isActive("underline")) marks.push("下划线");
  if (editor.isActive("strike")) marks.push("删除线");
  if (editor.isActive("link")) marks.push("链接");
  if (editor.isActive("code")) marks.push("行内代码");
  return [...path, ...marks];
}

export class StatusBar {
  private editor: Editor;
  private el: HTMLElement;
  private pathEl: HTMLElement;
  private wordsEl: HTMLElement;
  private charsEl: HTMLElement;
  private cleanups: (() => void)[] = [];

  constructor(editor: Editor) {
    this.editor = editor;
    this.el = h("div", {
      className: "flex items-center justify-between border-t border-se-border bg-se-bar px-3 py-1 text-[12px] text-se-faint",
    });
    const left = h("div", { className: "flex items-center gap-1" });
    const lbl = h("span");
    lbl.textContent = "路径:";
    this.pathEl = h("span", { className: "text-se-sub" });
    left.appendChild(lbl);
    left.appendChild(this.pathEl);
    const right = h("div", { className: "flex items-center gap-3" });
    const w1 = h("span");
    w1.textContent = "字数 ";
    this.wordsEl = h("span", { className: "text-se-sub" });
    w1.appendChild(this.wordsEl);
    const w2 = h("span");
    w2.textContent = "字符 ";
    this.charsEl = h("span", { className: "text-se-sub" });
    w2.appendChild(this.charsEl);
    right.appendChild(w1);
    right.appendChild(w2);
    this.el.appendChild(left);
    this.el.appendChild(right);

    this.sync();
    const handler = () => this.sync();
    this.editor.on("selectionUpdate", handler);
    this.editor.on("transaction", handler);
    this.editor.on("update", handler);
    this.cleanups.push(() => {
      this.editor.off("selectionUpdate", handler);
      this.editor.off("transaction", handler);
      this.editor.off("update", handler);
    });
  }

  private sync(): void {
    const count = computeWordCount(this.editor);
    this.wordsEl.textContent = String(count.words);
    this.charsEl.textContent = String(count.chars);
    const path = blockLabel(this.editor);
    this.pathEl.textContent = path.length ? path.join(" > ") : "—";
  }

  getElement(): HTMLElement {
    return this.el;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.el.remove();
  }
}
