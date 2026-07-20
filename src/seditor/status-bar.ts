import type { Editor } from "@tiptap/core";
import { h } from "./dom";
import type { WordCount } from "../editor/types";
import { DEFAULT_READING_SPEED } from "../editor/constants";
import type { I18n } from "../editor/core/i18n";

function computeWordCount(editor: Editor): WordCount {
  const text = editor.getText();
  const chars = text.length;
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[a-zA-Z0-9]+/g) || []).length;
  const words = cn + en;
  // 段落数：顶层 block 节点中 paragraph/heading/blockquote/codeBlock/listItem 等
  let paragraphs = 0;
  editor.state.doc.forEach((child) => {
    if (child.isTextblock) paragraphs++;
    else if (child.type.name === "bulletList" || child.type.name === "orderedList") {
      child.forEach((li) => {
        if (li.isTextblock) paragraphs++;
      });
    }
  });
  // 阅读时长：中文 300 字/分钟，英文 200 词/分钟，混合取近似值
  const readingTime = words > 0 ? Math.max(1, Math.ceil(words / DEFAULT_READING_SPEED)) : 0;
  return { chars, words, paragraphs, readingTime };
}

function blockLabel(editor: Editor, i18n: I18n): string[] {
  const path: string[] = [];
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const name = node.type.name;
    let label = "";
    switch (name) {
      case "paragraph": label = i18n.t("blockLabel.paragraph"); break;
      case "heading": label = i18n.t("blockLabel.heading", { level: node.attrs.level }); break;
      case "blockquote": label = i18n.t("blockLabel.blockquote"); break;
      case "codeBlock": label = i18n.t("blockLabel.codeBlock"); break;
      case "bulletList": label = i18n.t("blockLabel.bulletList"); break;
      case "orderedList": label = i18n.t("blockLabel.orderedList"); break;
      case "listItem": label = i18n.t("blockLabel.listItem"); break;
      case "table": label = i18n.t("blockLabel.table"); break;
      case "tableRow": label = i18n.t("blockLabel.tableRow"); break;
      case "tableCell": label = i18n.t("blockLabel.tableCell"); break;
      case "tableHeader": label = i18n.t("blockLabel.tableHeader"); break;
      default: label = name;
    }
    if (label) path.push(label);
  }
  path.reverse();
  const marks: string[] = [];
  if (editor.isActive("bold")) marks.push(i18n.t("markLabel.bold"));
  if (editor.isActive("italic")) marks.push(i18n.t("markLabel.italic"));
  if (editor.isActive("underline")) marks.push(i18n.t("markLabel.underline"));
  if (editor.isActive("strike")) marks.push(i18n.t("markLabel.strike"));
  if (editor.isActive("link")) marks.push(i18n.t("markLabel.link"));
  if (editor.isActive("code")) marks.push(i18n.t("markLabel.code"));
  return [...path, ...marks];
}

export class StatusBar {
  private editor: Editor;
  private i18n: I18n;
  private el: HTMLElement;
  private pathEl: HTMLElement;
  private wordsEl: HTMLElement;
  private charsEl: HTMLElement;
  private parasEl: HTMLElement;
  private readingEl: HTMLElement;
  private cleanups: (() => void)[] = [];

  constructor(editor: Editor, i18n: I18n) {
    this.editor = editor;
    this.i18n = i18n;
    this.el = h("div", {
      className: "flex items-center justify-between border-t border-se-border bg-se-bar px-3 py-1 text-[12px] text-se-faint",
    });
    const left = h("div", { className: "flex items-center gap-1" });
    const lbl = h("span");
    lbl.textContent = i18n.t("status.path");
    this.pathEl = h("span", { className: "text-se-sub" });
    left.appendChild(lbl);
    left.appendChild(this.pathEl);
    const right = h("div", { className: "flex items-center gap-3" });
    const w1 = h("span");
    w1.textContent = `${i18n.t("status.words")} `;
    this.wordsEl = h("span", { className: "text-se-sub" });
    w1.appendChild(this.wordsEl);
    const w2 = h("span");
    w2.textContent = `${i18n.t("status.chars")} `;
    this.charsEl = h("span", { className: "text-se-sub" });
    w2.appendChild(this.charsEl);
    const w3 = h("span");
    w3.textContent = `${i18n.t("status.paragraphs")} `;
    this.parasEl = h("span", { className: "text-se-sub" });
    w3.appendChild(this.parasEl);
    const w4 = h("span");
    w4.textContent = `${i18n.t("status.reading")} `;
    this.readingEl = h("span", { className: "text-se-sub" });
    w4.appendChild(this.readingEl);
    right.appendChild(w1);
    right.appendChild(w2);
    right.appendChild(w3);
    right.appendChild(w4);
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
    this.parasEl.textContent = String(count.paragraphs);
    this.readingEl.textContent = this.i18n.t("status.minutes", { minutes: count.readingTime });
    const path = blockLabel(this.editor, this.i18n);
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
