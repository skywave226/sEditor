/**
 * 轻量发布订阅状态管理（替代 Zustand）。
 */

export interface EditorUIState {
  isFullscreen: boolean;
  isSourceMode: boolean;
  activeDialog: string | null;
}

type Listener = (state: EditorUIState) => void;

export class UIStore {
  private state: EditorUIState = {
    isFullscreen: false,
    isSourceMode: false,
    activeDialog: null,
  };
  private listeners = new Set<Listener>();

  getState(): EditorUIState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  set(partial: Partial<EditorUIState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }

  toggleFullscreen(): void {
    this.set({ isFullscreen: !this.state.isFullscreen });
  }
  setFullscreen(v: boolean): void {
    this.set({ isFullscreen: v });
  }
  toggleSource(): void {
    this.set({ isSourceMode: !this.state.isSourceMode });
  }
  setSourceMode(v: boolean): void {
    this.set({ isSourceMode: v });
  }
  openDialog(d: string): void {
    this.set({ activeDialog: d });
  }
  closeDialog(): void {
    this.set({ activeDialog: null });
  }
}
