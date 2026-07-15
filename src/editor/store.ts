import { create } from "zustand";
import type { DialogType } from "./types";

interface EditorUIState {
  isFullscreen: boolean;
  isSourceMode: boolean;
  activeDialog: DialogType;
  /** 右键菜单坐标，null 表示关闭 */
  contextMenu: { x: number; y: number } | null;

  toggleFullscreen: () => void;
  setFullscreen: (v: boolean) => void;
  toggleSource: () => void;
  setSourceMode: (v: boolean) => void;
  openDialog: (d: Exclude<DialogType, null>) => void;
  closeDialog: () => void;
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;
}

export const useEditorStore = create<EditorUIState>((set) => ({
  isFullscreen: false,
  isSourceMode: false,
  activeDialog: null,
  contextMenu: null,

  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  setFullscreen: (v) => set({ isFullscreen: v }),
  toggleSource: () => set((s) => ({ isSourceMode: !s.isSourceMode })),
  setSourceMode: (v) => set({ isSourceMode: v }),
  openDialog: (d) => set({ activeDialog: d }),
  closeDialog: () => set({ activeDialog: null }),
  openContextMenu: (x, y) => set({ contextMenu: { x, y } }),
  closeContextMenu: () => set({ contextMenu: null }),
}));
