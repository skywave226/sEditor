import { Extension, markInputRule } from "@tiptap/core";

/**
 * 内联 Markdown 快捷输入
 *
 * TipTap StarterKit 已支持块级 Markdown（# 标题、- 列表、> 引用、--- 分割线、``` 代码块）。
 * 本扩展补充内联 Markdown 标记：
 * - `**text**` 和 `__text__` → 加粗
 * - `*text*` 和 `_text_` → 斜体
 * - `~~text~~` → 删除线
 * - `` `text` `` → 行内代码
 */
export const MarkdownShortcuts = Extension.create({
  name: "markdownShortcuts",

  addInputRules() {
    const marks = this.editor.schema.marks;
    const rules: ReturnType<typeof markInputRule>[] = [];

    if (marks.bold) {
      rules.push(
        markInputRule({ find: /\*\*([^*]+)\*\*$/, type: marks.bold }),
        markInputRule({ find: /__([^_]+)__$/, type: marks.bold }),
      );
    }
    if (marks.italic) {
      rules.push(
        markInputRule({ find: /(?:^|[^*])\*([^*]+)\*$/, type: marks.italic }),
        markInputRule({ find: /(^|[^_])_([^_]+)_$/, type: marks.italic }),
      );
    }
    if (marks.strike) {
      rules.push(markInputRule({ find: /~~([^~]+)~~$/, type: marks.strike }));
    }
    if (marks.code) {
      rules.push(markInputRule({ find: /`([^`]+)`$/, type: marks.code }));
    }

    return rules;
  },
});
