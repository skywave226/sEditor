import Image from "@tiptap/extension-image";
import type { NodeViewRendererProps } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { getIcon } from "../../seditor/icons";

type ImageAlign = "none" | "left" | "right" | "center";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setImageAlign: (align: ImageAlign) => ReturnType;
    };
  }
}

/** 创建浮动工具栏按钮 */
function makeToolbarBtn(title: string, svg: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = title;
  btn.style.cssText =
    "width:24px;height:24px;display:flex;align-items:center;justify-content:center;" +
    "background:rgba(255,255,255,0.9);border:none;border-radius:4px;cursor:pointer;color:#374151;";
  btn.innerHTML = svg;
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

/**
 * 可调整大小的图片扩展
 *
 * 通过自定义 NodeView 在图片右下角添加拖拽手柄，
 * 拖拽时按比例缩放图片并写入 node.attrs.width。
 * - 拖拽时按住 Shift：自由调整宽度（不保持比例）
 * - 默认：保持宽高比，按宽度缩放
 */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const img = el as HTMLImageElement;
          // 优先取 width 属性，其次取 style.width
          const w = img.getAttribute("width");
          if (w) return w;
          const styleW = img.style.width;
          if (styleW) return styleW;
          return null;
        },
        renderHTML: (attrs) => {
          if (!attrs.width) return {};
          return { width: attrs.width };
        },
      },
      align: {
        default: "none",
        parseHTML: (el) => {
          const img = el as HTMLImageElement;
          const style = img.style;
          if (style.float === "left") return "left";
          if (style.float === "right") return "right";
          if (style.display === "block" && style.marginLeft === "auto" && style.marginRight === "auto") return "center";
          return "none";
        },
        renderHTML: (attrs) => {
          const align = (attrs.align as ImageAlign) || "none";
          if (align === "none") return {};
          return { "data-align": align };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align: ImageAlign) =>
        ({ chain }): boolean =>
          chain().updateAttributes("image", { align }).run(),
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }: NodeViewRendererProps) => {
      // 容器：inline-block，相对定位，包裹 img 和 handle
      const wrapper = document.createElement("span");
      wrapper.className = "se-img-resizable";
      wrapper.style.display = "inline-block";
      wrapper.style.position = "relative";
      wrapper.style.lineHeight = "0";
      wrapper.style.maxWidth = "100%";

      const img = document.createElement("img");
      img.style.display = "block";
      img.style.maxWidth = "100%";
      img.draggable = false;
      wrapper.appendChild(img);

      // 右下角拖拽手柄
      const handle = document.createElement("span");
      handle.className = "se-img-resize-handle";
      handle.style.position = "absolute";
      handle.style.right = "-4px";
      handle.style.bottom = "-4px";
      handle.style.width = "10px";
      handle.style.height = "10px";
      handle.style.background = "#3b82f6";
      handle.style.border = "1px solid #fff";
      handle.style.borderRadius = "50%";
      handle.style.cursor = "nwse-resize";
      handle.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
      handle.style.opacity = "0";
      handle.style.transition = "opacity 0.15s";
      wrapper.appendChild(handle);

      // 浮动对齐工具栏（hover 时显示）
      const toolbar = document.createElement("div");
      toolbar.className = "se-img-toolbar";
      toolbar.style.cssText =
        "position:absolute;top:-36px;left:50%;transform:translateX(-50%);" +
        "display:flex;gap:2px;padding:4px;background:rgba(31,41,55,0.92);" +
        "border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.2);" +
        "opacity:0;pointer-events:none;transition:opacity 0.15s;z-index:10;";
      const alignBtn = (title: string, icon: string, align: ImageAlign) =>
        makeToolbarBtn(title, getIcon(icon), () => {
          editor.chain().focus().setImageAlign(align).run();
        });
      toolbar.appendChild(alignBtn("默认", "alignJustify", "none"));
      toolbar.appendChild(alignBtn("左浮动", "alignLeft", "left"));
      toolbar.appendChild(alignBtn("居中", "alignCenter", "center"));
      toolbar.appendChild(alignBtn("右浮动", "alignRight", "right"));
      // 删除按钮
      const delBtn = makeToolbarBtn("删除图片", getIcon("trash"), () => {
        if (typeof getPos === "function") {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
          }
        }
      });
      delBtn.style.color = "#ef4444";
      toolbar.appendChild(delBtn);
      wrapper.appendChild(toolbar);

      // hover 时显示手柄和工具栏
      wrapper.addEventListener("mouseenter", () => {
        handle.style.opacity = "1";
        toolbar.style.opacity = "1";
        toolbar.style.pointerEvents = "auto";
      });
      wrapper.addEventListener("mouseleave", () => {
        if (!handle.dataset.dragging) handle.style.opacity = "0";
        toolbar.style.opacity = "0";
        toolbar.style.pointerEvents = "none";
      });

      // 渲染节点 attrs
      const renderAttrs = (n: Node) => {
        const attrs = n.attrs as { src: string; alt?: string; title?: string; width?: string | number | null; align?: ImageAlign };
        img.src = attrs.src;
        if (attrs.alt) img.alt = attrs.alt; else img.removeAttribute("alt");
        if (attrs.title) img.title = attrs.title; else img.removeAttribute("title");
        if (attrs.width) img.style.width = typeof attrs.width === "number" ? `${attrs.width}px` : attrs.width;
        else img.style.width = "";
        const align = attrs.align || "none";
        // 重置
        img.style.float = "";
        img.style.display = "";
        img.style.marginLeft = "";
        img.style.marginRight = "";
        wrapper.style.display = "inline-block";
        wrapper.style.textAlign = "";
        if (align === "left") {
          img.style.float = "left";
          img.style.marginRight = "12px";
          img.style.marginBottom = "6px";
        } else if (align === "right") {
          img.style.float = "right";
          img.style.marginLeft = "12px";
          img.style.marginBottom = "6px";
        } else if (align === "center") {
          img.style.display = "block";
          img.style.marginLeft = "auto";
          img.style.marginRight = "auto";
        }
      };
      renderAttrs(node);

      // 拖拽逻辑
      let dragging = false;
      let startX = 0;
      let startWidth = 0;

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        handle.dataset.dragging = "1";
        startX = e.clientX;
        startWidth = img.offsetWidth;

        const onMove = (ev: MouseEvent) => {
          if (!dragging) return;
          const delta = ev.clientX - startX;
          let newWidth = Math.max(20, startWidth + delta);
          // 不超过容器宽度
          const maxWidth = wrapper.parentElement?.clientWidth ?? 9999;
          if (newWidth > maxWidth) newWidth = maxWidth;
          img.style.width = `${newWidth}px`;
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          delete handle.dataset.dragging;
          handle.style.opacity = "0";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          // 写入 attrs
          const finalWidth = Math.round(img.offsetWidth);
          if (typeof getPos === "function") {
            const pos = getPos();
            if (typeof pos === "number") {
              editor
                .chain()
                .focus()
                .command(({ tr }) => {
                  tr.setNodeMarkup(pos, undefined, {
                    ...(node.attrs as object),
                    width: finalWidth,
                  });
                  return true;
                })
                .run();
            }
          }
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      // 点击图片选中节点
      img.addEventListener("click", (e) => {
        // NodeView 默认会处理选中，这里仅阻止图片默认拖拽
        e.stopPropagation();
      });

      return {
        dom: wrapper,
        update(node: Node) {
          if (node.type.name !== "image") return false;
          renderAttrs(node);
          return true;
        },
        // 让 ProseMirror 选区能正确覆盖到图片
        stopEvent(e) {
          // 拖拽手柄的事件不传递给 ProseMirror
          if (e.type === "mousedown" && (e.target as HTMLElement).classList.contains("se-img-resize-handle")) {
            return true;
          }
          return false;
        },
        ignoreMutation() {
          return true;
        },
      };
    };
  },
});
