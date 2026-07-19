import type { Editor } from "@tiptap/core";
import { cn, h, fromHTML, onEscape } from "./dom";
import { getIcon } from "./icons";
import { commandRegistry } from "../editor/commands/registry";
import type { UIStore } from "./store";
import type { EditorConfig } from "../editor/types";

const inputClass =
  "w-full rounded border border-se-border px-2.5 py-1.5 text-[13px] text-se-ink outline-none focus:border-se-primary";

/** 通用对话框壳 */
function buildDialogShell(opts: {
  title: string;
  width?: number;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmDisabled?: boolean;
}): { shell: HTMLElement; body: HTMLElement } {
  const shell = h("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/30",
  });
  const inner = h("div", {
    className: "flex max-h-[90vh] flex-col overflow-hidden rounded-lg border border-se-border bg-white shadow-panel",
  });
  (inner as HTMLElement).style.width = `${opts.width ?? 420}px`;

  const header = h("div", {
    className: "flex items-center justify-between border-b border-se-border bg-se-bar px-4 py-2.5",
  });
  const titleEl = h("span", { className: "text-[14px] font-medium text-se-ink" });
  titleEl.textContent = opts.title;
  const closeBtn = fromHTML(`<button type="button" class="text-se-faint hover:text-se-ink">${getIcon("x")}</button>`);
  closeBtn.addEventListener("click", opts.onClose);
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const body = h("div", { className: "flex-1 overflow-auto p-4" });

  const footer = h("div", {
    className: "flex justify-end gap-2 border-t border-se-border bg-se-bar px-4 py-2.5",
  });
  const cancelBtn = h("button", {
    type: "button",
    className: "rounded border border-se-border bg-white px-3 py-1.5 text-[13px] text-se-sub hover:bg-se-hover",
  });
  cancelBtn.textContent = "取消";
  cancelBtn.addEventListener("click", opts.onClose);
  footer.appendChild(cancelBtn);

  if (opts.onConfirm) {
    const okBtn = h("button", {
      type: "button",
      className: "rounded bg-se-primary px-3 py-1.5 text-[13px] text-white hover:bg-se-primary-text disabled:opacity-50",
    });
    okBtn.textContent = opts.confirmText ?? "确定";
    okBtn.disabled = !!opts.confirmDisabled;
    okBtn.addEventListener("click", opts.onConfirm);
    footer.appendChild(okBtn);
  }

  shell.appendChild(inner);
  inner.appendChild(header);
  inner.appendChild(body);
  inner.appendChild(footer);

  // 遮罩点击关闭
  shell.addEventListener("mousedown", (e) => {
    if (e.target === shell) opts.onClose();
  });

  return { shell, body };
}

function buildField(label: string, control: HTMLElement): HTMLElement {
  const wrap = h("label", { className: "mb-3 block" });
  const lbl = h("span", { className: "mb-1 block text-[12px] text-se-sub" });
  lbl.textContent = label;
  wrap.appendChild(lbl);
  wrap.appendChild(control);
  return wrap;
}

function buildInput(opts: { value?: string; placeholder?: string; autoFocus?: boolean; onInput?: (v: string) => void; type?: string; min?: number; max?: number }): HTMLInputElement {
  const inp = h("input", { className: inputClass });
  if (opts.value) (inp as HTMLInputElement).value = opts.value;
  if (opts.placeholder) (inp as HTMLInputElement).placeholder = opts.placeholder;
  if (opts.type) (inp as HTMLInputElement).type = opts.type;
  if (opts.min != null) (inp as HTMLInputElement).min = String(opts.min);
  if (opts.max != null) (inp as HTMLInputElement).max = String(opts.max);
  if (opts.onInput) inp.addEventListener("input", () => opts.onInput!((inp as HTMLInputElement).value));
  if (opts.autoFocus) setTimeout(() => inp.focus(), 0);
  return inp;
}

export class DialogManager {
  private editor: Editor;
  private store: UIStore;
  private config?: EditorConfig;
  private current: HTMLElement | null = null;
  private cleanup: (() => void)[] = [];

  constructor(editor: Editor, store: UIStore, config?: EditorConfig) {
    this.editor = editor;
    this.store = store;
    this.config = config;
  }

  /** 清理当前对话框 DOM 与副作用，但不动 store 状态 */
  private dispose(): void {
    if (this.current) {
      this.current.remove();
      this.current = null;
    }
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }

  open(name: string): void {
    this.dispose();
    let shell: HTMLElement | null = null;
    if (name === "link") shell = this.buildLinkDialog();
    else if (name === "image") shell = this.buildImageDialog();
    else if (name === "file") shell = this.buildFileDialog();
    else if (name === "table") shell = this.buildTableDialog();
    else if (name === "specialChar") shell = this.buildSpecialCharDialog();
    if (!shell) {
      // 未知对话框名：重置 store 以免状态卡死
      this.store.closeDialog();
      return;
    }
    this.current = shell;
    document.body.appendChild(shell);
    this.cleanup.push(onEscape(() => this.close()));
  }

  close(): void {
    const hadDialog = this.current !== null;
    this.dispose();
    // 仅在确实关闭了对话框时回写状态，避免 close→closeDialog→close 的回环
    if (hadDialog) {
      this.store.closeDialog();
    }
  }

  private buildLinkDialog(): HTMLElement {
    let href = "";
    let text = "";
    let target = "_blank";
    const prev = this.editor.getAttributes("link");
    href = prev.href ?? "";
    target = prev.target ?? "_blank";
    const { from, to, empty } = this.editor.state.selection;
    if (!empty) text = this.editor.state.doc.textBetween(from, to, " ");

    const { shell, body } = buildDialogShell({
      title: "超链接",
      width: 440,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = href.trim();
        if (!url) return;
        if (text && this.editor.state.selection.empty) {
          // 插入文本后选中它，否则 setLink 因选区为空只会设置 storedMarks，
          // 导致插入的文本并不是超链接
          const from = this.editor.state.selection.from;
          this.editor.chain()
            .focus()
            .insertContent(text)
            .setTextSelection({ from, to: from + text.length })
            .run();
        }
        commandRegistry.run(this.editor, "link", {
          href: url,
          target: target === "_blank" ? "_blank" : "_self",
        });
        this.close();
      },
      confirmDisabled: !href.trim(),
    });

    const hrefInput = buildInput({ value: href, placeholder: "https://", autoFocus: true, onInput: (v) => { href = v; } });
    body.appendChild(buildField("链接地址", hrefInput));
    const textInput = buildInput({ value: text, placeholder: "（可选）", onInput: (v) => { text = v; } });
    body.appendChild(buildField("链接文本", textInput));

    const radioWrap = h("div", { className: "flex gap-4 text-[13px] text-se-ink" });
    const r1 = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="target" ${target === "_blank" ? "checked" : ""}>新窗口</label>`);
    const r2 = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="target" ${target === "_self" ? "checked" : ""}>当前窗口</label>`);
    (r1.querySelector("input") as HTMLInputElement).addEventListener("change", () => { target = "_blank"; });
    (r2.querySelector("input") as HTMLInputElement).addEventListener("change", () => { target = "_self"; });
    radioWrap.appendChild(r1);
    radioWrap.appendChild(r2);
    body.appendChild(buildField("打开方式", radioWrap));

    if (this.editor.isActive("link")) {
      const rmBtn = h("button", { type: "button", className: "text-[12px] text-se-primary hover:underline" });
      rmBtn.textContent = "取消已有链接";
      rmBtn.addEventListener("click", () => {
        commandRegistry.run(this.editor, "link", { href: "" });
        this.close();
      });
      body.appendChild(rmBtn);
    }
    return shell;
  }

  private buildImageDialog(): HTMLElement {
    let src = "";
    let alt = "";
    let width = "";
    let align: "left" | "center" | "right" = "center";
    let tab: "url" | "upload" = "url";
    let uploading = false;

    const { shell, body } = buildDialogShell({
      title: "插入图片",
      width: 460,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        const opts: Record<string, unknown> = { src: url };
        if (alt) opts.alt = alt;
        if (width) opts.width = width;
        commandRegistry.run(this.editor, "image", opts);
        this.editor.chain().focus().setTextAlign(align).run();
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const renderBody = () => {
      body.innerHTML = "";
      if (this.config?.imageUpload) {
        const tabBar = h("div", { className: "mb-3 flex border-b border-se-border text-[13px]" });
        (["url", "upload"] as const).forEach((t) => {
          const tb = h("button", {
            type: "button",
            className: cn(
              "px-3 py-1.5",
              tab === t ? "border-b-2 border-se-primary text-se-primary-text" : "text-se-sub",
            ),
          });
          tb.textContent = t === "url" ? "网络图片" : "本地上传";
          tb.addEventListener("click", () => { tab = t; renderBody(); });
          tabBar.appendChild(tb);
        });
        body.appendChild(tabBar);
      }

      if (tab === "upload") {
        const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
        fileInput.accept = "image/*";
        // 多图上传：默认开启，可由配置关闭
        if (this.config?.imageMultiUpload !== false) {
          fileInput.multiple = true;
        }
        const statusEl = h("div", { className: "mt-1 text-[12px]" });
        const multiTip = h("div", { className: "mb-2 text-[12px] text-se-faint" });
        multiTip.textContent = fileInput.multiple ? "可按住 Ctrl/Shift 多选，所有图片将依次插入。" : "每次仅可选择一张图片。";
        fileInput.addEventListener("change", async () => {
          const files = Array.from(fileInput.files ?? []);
          if (files.length === 0) return;
          if (!this.config?.imageUpload) {
            statusEl.textContent = "未配置上传能力，请使用 URL 插入。";
            statusEl.className = "mt-1 text-[12px] text-red-500";
            return;
          }
          const maxSize = this.config.imageMaxSize ?? 5 * 1024 * 1024;
          // 校验所有文件
          const invalid: string[] = [];
          for (const f of files) {
            if (!f.type.startsWith("image/")) {
              invalid.push(`${f.name}（非图片）`);
            } else if (f.size > maxSize) {
              invalid.push(`${f.name}（超过 ${Math.round(maxSize / 1024 / 1024)}MB）`);
            }
          }
          if (invalid.length > 0) {
            statusEl.textContent = `以下文件将被跳过：${invalid.join("、")}`;
            statusEl.className = "mt-1 text-[12px] text-red-500";
          }

          const validFiles = files.filter(
            (f) => f.type.startsWith("image/") && f.size <= maxSize,
          );
          if (validFiles.length === 0) {
            return;
          }

          uploading = true;
          statusEl.textContent = `上传中… (0/${validFiles.length})`;
          statusEl.className = "mt-1 text-[12px] text-se-primary";
          body.appendChild(statusEl);

          // 单图：保持原有行为（切回 URL Tab 让用户继续设置 alt/width/align）
          // 多图：逐张上传后批量插入，关闭对话框
          const isMulti = validFiles.length > 1;
          try {
            const uploadFn = this.config.imageUpload;
            if (!uploadFn) throw new Error("未配置上传能力");
            if (!isMulti) {
              const url = await uploadFn(validFiles[0]);
              if (!url || typeof url !== "string") {
                throw new Error("上传返回值无效");
              }
              src = url;
              tab = "url";
              uploading = false;
              renderBody();
            } else {
              const urls: string[] = [];
              for (let i = 0; i < validFiles.length; i++) {
                statusEl.textContent = `上传中… (${i + 1}/${validFiles.length})`;
                const url = await uploadFn(validFiles[i]);
                if (!url || typeof url !== "string") {
                  throw new Error(`第 ${i + 1} 张图片上传返回值无效`);
                }
                urls.push(url);
              }
              // 批量插入：每张图独立段落，按选定对齐方式
              const chain = this.editor.chain().focus();
              urls.forEach((u, idx) => {
                if (idx > 0) chain.createParagraphNear();
                chain.setImage({ src: u });
                chain.setTextAlign(align);
              });
              chain.run();
              uploading = false;
              this.close();
            }
          } catch (err) {
            console.error("[sEditor] 图片上传失败:", err);
            const msg = err instanceof Error ? err.message : "未知错误";
            statusEl.textContent = `上传失败：${msg}。`;
            statusEl.className = "mt-1 text-[12px] text-red-500";
            uploading = false;
          }
        });
        body.appendChild(buildField("选择文件", fileInput));
        body.appendChild(multiTip);
        if (uploading) body.appendChild(statusEl);
      } else {
        const urlInput = buildInput({ value: src, placeholder: "https://", autoFocus: true, onInput: (v) => { src = v; } });
        body.appendChild(buildField("图片地址", urlInput));
      }

      const altInput = buildInput({ value: alt, placeholder: "（可选）", onInput: (v) => { alt = v; } });
      body.appendChild(buildField("替代文本", altInput));
      const wInput = buildInput({ value: width, placeholder: "如 400 或 100%", onInput: (v) => { width = v; } });
      body.appendChild(buildField("宽度（px 或 %）", wInput));

      const alignWrap = h("div", { className: "flex gap-4 text-[13px] text-se-ink" });
      (["left", "center", "right"] as const).forEach((a) => {
        const lbl = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="align" ${align === a ? "checked" : ""}>${a === "left" ? "左对齐" : a === "center" ? "居中" : "右对齐"}</label>`);
        (lbl.querySelector("input") as HTMLInputElement).addEventListener("change", () => { align = a; });
        alignWrap.appendChild(lbl);
      });
      body.appendChild(buildField("对齐方式", alignWrap));
    };
    renderBody();
    return shell;
  }

  private buildFileDialog(): HTMLElement {
    const { shell, body } = buildDialogShell({
      title: "插入文件",
      width: 460,
      onClose: () => this.close(),
      onConfirm: () => {
        // 文件对话框的上传是即时的，确定按钮仅用于关闭
        this.close();
      },
      confirmText: "关闭",
      confirmDisabled: false,
    });

    if (!this.config?.fileUpload) {
      const tip = h("div", { className: "py-4 text-center text-[13px] text-se-faint" });
      tip.textContent = "未配置 fileUpload 函数，无法使用文件上传功能。";
      body.appendChild(tip);
      return shell;
    }

    const cfg = this.config;
    const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
    const listEl = h("div", { className: "mt-2 flex flex-col gap-1.5" });
    const tip = h("div", { className: "mb-2 text-[12px] text-se-faint" });
    const maxSize = cfg.fileMaxSize ?? 20 * 1024 * 1024;
    const allowedExts = cfg.fileAllowedExts ?? null;
    tip.textContent = `单文件上限 ${Math.round(maxSize / 1024 / 1024)}MB${
      allowedExts && allowedExts.length > 0 ? `，仅支持 ${allowedExts.join("、")}` : ""
    }。上传成功后将作为下载链接插入。`;

    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files ?? []);
      if (files.length === 0) return;
      for (const file of files) {
        const row = h("div", { className: "flex items-center justify-between rounded border border-se-border px-2 py-1.5 text-[12px]" });
        const nameEl = h("span", { className: "flex-1 truncate text-se-ink" });
        nameEl.textContent = file.name;
        const statusEl = h("span", { className: "ml-2 text-se-faint" });
        statusEl.textContent = "上传中…";
        row.appendChild(nameEl);
        row.appendChild(statusEl);
        listEl.appendChild(row);

        // 校验大小
        if (file.size > maxSize) {
          statusEl.textContent = `超过 ${Math.round(maxSize / 1024 / 1024)}MB`;
          statusEl.className = "ml-2 text-red-500";
          continue;
        }
        // 校验扩展名
        if (allowedExts && allowedExts.length > 0) {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          if (!allowedExts.includes(ext)) {
            statusEl.textContent = `不支持 .${ext}`;
            statusEl.className = "ml-2 text-red-500";
            continue;
          }
        }

        try {
          const uploadFn = cfg.fileUpload;
          if (!uploadFn) throw new Error("未配置上传能力");
          const url = await uploadFn(file);
          if (!url || typeof url !== "string") {
            throw new Error("上传返回值无效");
          }
          // 插入文件下载链接
          commandRegistry.run(this.editor, "file", {
            src: url,
            name: file.name,
            download: true,
          });
          statusEl.textContent = "已插入";
          statusEl.className = "ml-2 text-green-600";
        } catch (err) {
          console.error("[sEditor] 文件上传失败:", err);
          const msg = err instanceof Error ? err.message : "未知错误";
          statusEl.textContent = `失败：${msg}`;
          statusEl.className = "ml-2 text-red-500";
        }
      }
      // 清空 input，允许再次选择同名文件
      fileInput.value = "";
    });

    body.appendChild(buildField("选择文件", fileInput));
    body.appendChild(tip);
    body.appendChild(listEl);
    return shell;
  }

  private buildTableDialog(): HTMLElement {
    let rows = 3;
    let cols = 3;
    let withHeader = true;
    const { shell, body } = buildDialogShell({
      title: "插入表格",
      width: 400,
      onClose: () => this.close(),
      onConfirm: () => {
        commandRegistry.run(this.editor, "table", {
          rows: Math.max(1, rows),
          cols: Math.max(1, cols),
          withHeader,
        });
        this.close();
      },
    });
    const rowInput = buildInput({ value: String(rows), type: "number", min: 1, max: 20, onInput: (v) => { rows = Number(v) || 1; } });
    const colInput = buildInput({ value: String(cols), type: "number", min: 1, max: 10, onInput: (v) => { cols = Number(v) || 1; } });
    const gap = h("div", { className: "flex gap-4" });
    const rc = h("div", { className: "flex-1" });
    const cc = h("div", { className: "flex-1" });
    rc.appendChild(buildField("行数", rowInput));
    cc.appendChild(buildField("列数", colInput));
    gap.appendChild(rc);
    gap.appendChild(cc);
    body.appendChild(gap);
    const chk = fromHTML(`<label class="flex items-center gap-1.5 text-[13px] text-se-ink"><input type="checkbox" ${withHeader ? "checked" : ""}>包含表头行</label>`);
    (chk.querySelector("input") as HTMLInputElement).addEventListener("change", (e) => {
      withHeader = (e.target as HTMLInputElement).checked;
    });
    body.appendChild(buildField("表头", chk));
    return shell;
  }

  private buildSpecialCharDialog(): HTMLElement {
    const groups: { name: string; chars: string[] }[] = [
      { name: "常用", chars: ["、", "。", "，", "；", "：", "？", "！", "「", "」", "『", "』", "〈", "〉", "《", "》", "【", "】", "〔", "〕", "—", "…", "·", "～"] },
      { name: "数学", chars: ["±", "×", "÷", "∈", "∏", "∑", "√", "∝", "∞", "∟", "∠", "∥", "∧", "∨", "∩", "∪", "∫", "∮", "≠", "≤", "≥", "≡", "≈", "⊕"] },
      { name: "单位", chars: ["℃", "℉", "‰", "′", "″", "§", "№", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼"] },
      { name: "箭头", chars: ["←", "↑", "→", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "⇐", "⇒", "⇔"] },
      { name: "希腊", chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "ψ", "ω", "Δ", "Σ", "Ω"] },
    ];
    let group = 0;
    const { shell, body } = buildDialogShell({
      title: "特殊字符",
      width: 420,
      onClose: () => this.close(),
    });
    const render = () => {
      body.innerHTML = "";
      const tabBar = h("div", { className: "mb-2 flex flex-wrap gap-1" });
      groups.forEach((g, i) => {
        const tb = h("button", {
          type: "button",
          className: cn("rounded px-2 py-1 text-[12px]", group === i ? "bg-se-primary text-white" : "text-se-sub hover:bg-se-hover"),
        });
        tb.textContent = g.name;
        tb.addEventListener("click", () => { group = i; render(); });
        tabBar.appendChild(tb);
      });
      body.appendChild(tabBar);
      const grid = h("div", { className: "grid grid-cols-8 gap-1" });
      groups[group].chars.forEach((c) => {
        const btn = h("button", {
          type: "button",
          className: "flex h-8 items-center justify-center rounded border border-se-border text-[16px] text-se-ink hover:border-se-primary hover:bg-se-active",
        });
        btn.textContent = c;
        btn.addEventListener("click", () => {
          commandRegistry.run(this.editor, "specialChar", c);
        });
        grid.appendChild(btn);
      });
      body.appendChild(grid);
      const tip = h("div", { className: "mt-3 text-[12px] text-se-faint" });
      tip.textContent = "点击字符插入，可连续插入多个。";
      body.appendChild(tip);
    };
    render();
    return shell;
  }

  destroy(): void {
    this.close();
  }
}
