import { Node, mergeAttributes } from "@tiptap/core";

/**
 * 视频节点：渲染为 <video controls>，支持 width 属性。
 * 插入走 commandRegistry 的 video 命令，直接 insertContent。
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
      controls: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes, {
      controls: node.attrs.controls !== false ? "controls" : undefined,
    });
    if (node.attrs.width) attrs.style = `width:${node.attrs.width}`;
    return ["video", attrs];
  },
  addNodeView() {
    return ({ node }) => {
      const video = document.createElement("video");
      if (node.attrs.src) video.src = node.attrs.src;
      if (node.attrs.controls !== false) video.controls = true;
      if (node.attrs.width) video.style.width = String(node.attrs.width);
      video.style.maxWidth = "100%";
      return { dom: video };
    };
  },
});

/**
 * 音频节点：渲染为 <audio controls>
 */
export const Audio = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: "audio" }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes, {
      controls: node.attrs.controls !== false ? "controls" : undefined,
    });
    return ["audio", attrs];
  },
  addNodeView() {
    return ({ node }) => {
      const audio = document.createElement("audio");
      if (node.attrs.src) audio.src = node.attrs.src;
      if (node.attrs.controls !== false) audio.controls = true;
      audio.style.maxWidth = "100%";
      return { dom: audio };
    };
  },
});
