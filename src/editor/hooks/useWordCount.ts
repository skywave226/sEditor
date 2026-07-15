import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { WordCount } from "../types";

/**
 * 实时统计字数：chars 为纯文本字符数，words 为中英文词数（中文按字、英文按词）。
 */
export function useWordCount(editor: Editor | null): WordCount {
  const [count, setCount] = useState<WordCount>({ chars: 0, words: 0 });

  useEffect(() => {
    if (!editor) return;
    const compute = () => {
      const text = editor.getText();
      const chars = text.length;
      // 中文按字计数，英文连续字母数字按词计数
      const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const en = (text.match(/[a-zA-Z0-9]+/g) || []).length;
      setCount({ chars, words: cn + en });
    };
    compute();
    editor.on("update", compute);
    return () => {
      editor.off("update", compute);
    };
  }, [editor]);

  return count;
}
