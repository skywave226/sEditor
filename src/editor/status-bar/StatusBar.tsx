import type { Editor } from "@tiptap/core";
import { useWordCount } from "../hooks/useWordCount";
import { useEditorState } from "../hooks/useEditorState";

function blockLabel(editor: Editor): string[] {
  const path: string[] = [];
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    const name = node.type.name;
    let label = "";
    switch (name) {
      case "paragraph":
        label = "正文";
        break;
      case "heading": {
        const level = node.attrs.level as number;
        label = `标题 ${level}`;
        break;
      }
      case "blockquote":
        label = "引用";
        break;
      case "codeBlock":
        label = "代码块";
        break;
      case "bulletList":
        label = "无序列表";
        break;
      case "orderedList":
        label = "有序列表";
        break;
      case "listItem":
        label = "列表项";
        break;
      case "table":
        label = "表格";
        break;
      case "tableRow":
        label = "行";
        break;
      case "tableCell":
        label = "单元格";
        break;
      case "tableHeader":
        label = "表头";
        break;
      default:
        label = name;
    }
    if (label) path.push(label);
  }
  path.reverse();

  // 追加激活的标记
  const marks: string[] = [];
  if (editor.isActive("bold")) marks.push("加粗");
  if (editor.isActive("italic")) marks.push("斜体");
  if (editor.isActive("underline")) marks.push("下划线");
  if (editor.isActive("strike")) marks.push("删除线");
  if (editor.isActive("link")) marks.push("链接");
  if (editor.isActive("code")) marks.push("行内代码");

  return [...path, ...marks];
}

export function StatusBar({ editor }: { editor: Editor }) {
  useEditorState(editor);
  const count = useWordCount(editor);
  const path = blockLabel(editor);

  return (
    <div className="flex items-center justify-between border-t border-ue-border bg-ue-bar px-3 py-1 text-[12px] text-ue-faint">
      <div className="flex items-center gap-1">
        <span>路径:</span>
        <span className="text-ue-sub">{path.length ? path.join(" > ") : "—"}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>
          字数 <span className="text-ue-sub">{count.words}</span>
        </span>
        <span>
          字符 <span className="text-ue-sub">{count.chars}</span>
        </span>
      </div>
    </div>
  );
}
