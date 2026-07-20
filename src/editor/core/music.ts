import { Node } from "@tiptap/core";

export interface MusicOptions {
  src: string;
  name?: string;
  artist?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    music: {
      insertMusic: (options: MusicOptions) => ReturnType;
    };
  }
}

/**
 * 音乐节点：渲染为音频播放器，支持通用音频地址。
 */
export const Music = Node.create({
  name: "music",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "" },
      artist: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "audio[data-music]" }, { tag: "div[data-music]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as { src?: string; name?: string; artist?: string };
    const title = [attrs.name, attrs.artist].filter(Boolean).join(" - ") || "音乐";
    return [
      "div",
      { "data-music": "true", style: "padding:8px 12px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;gap:8px;" },
      ["span", { style: "font-size:18px" }, "🎵"],
      ["span", { style: "flex:1;font-size:13px;color:#374151" }, title],
      ["audio", { src: attrs.src, controls: true, style: "max-width:260px;height:32px;" }],
    ];
  },

  addCommands() {
    return {
      insertMusic:
        (options) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: options }).run(),
    };
  },
});
