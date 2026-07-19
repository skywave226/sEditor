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
    const next = { ...this.state, ...partial };
    // 浅比较：状态未变时不通知，避免监听器回环触发无限递归
    const keys = Object.keys(next) as (keyof EditorUIState)[];
    const changed = keys.some((k) => next[k] !== this.state[k]);
    if (!changed) return;
    this.state = next;
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
