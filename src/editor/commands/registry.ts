import type { Editor } from "@tiptap/core";
import type { EditorCommand } from "../types";

/**
 * 命令注册表：所有格式化与插入操作抽象为命名命令，
 * 工具栏按钮仅通过命令名触发，便于扩展与测试。
 */
export class CommandRegistry {
  private commands = new Map<string, EditorCommand>();

  register(cmd: EditorCommand): void {
    this.commands.set(cmd.name, cmd);
  }

  registerAll(cmds: EditorCommand[]): void {
    cmds.forEach((c) => this.register(c));
  }

  get(name: string): EditorCommand | undefined {
    return this.commands.get(name);
  }

  can(editor: Editor, name: string): boolean {
    return this.commands.get(name)?.can(editor) ?? false;
  }

  isActive(editor: Editor, name: string): boolean {
    return this.commands.get(name)?.isActive(editor) ?? false;
  }

  run(editor: Editor, name: string, payload?: unknown): void {
    this.commands.get(name)?.run(editor, payload);
  }
}

/** 全局单例注册表 */
export const commandRegistry = new CommandRegistry();
