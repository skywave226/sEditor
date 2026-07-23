import type { Editor } from "@tiptap/core";
import { cn, h, fromHTML, onEscape, trapFocus } from "./dom";
import { getIcon } from "./icons";
import { commandRegistry } from "../editor/commands/registry";
import type { UIStore } from "./store";
import type { EditorConfig } from "../editor/types";
import { reportError } from "../editor/core/logger";
import type { I18n, I18nMessagesKey } from "../editor/core/i18n";
import { DIALOG_WIDTH, DEFAULT_IMAGE_MAX_SIZE, DEFAULT_FILE_MAX_SIZE, DEFAULT_IMAGE_COMPRESS } from "../editor/constants";
import { compressImage, type CompressOptions } from "../editor/core/image-utils";

const inputClass =
  "w-full rounded border border-se-border px-2.5 py-1.5 text-[13px] text-se-ink outline-none focus:border-se-primary";

/** 若输入为纯数字像素值，根据原图比例计算另一边像素值 */
function calcPixelRatio(value: string, base: number, target: number): string | null {
  if (!/^\d+(\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number.parseFloat(value.trim());
  if (Number.isNaN(parsed) || parsed <= 0 || !base || !target) return null;
  return String(Math.round(parsed * (target / base)));
}

/** 根据条件更新对话框"确定"按钮的 disabled 状态 */
function setOkDisabled(shell: HTMLElement, disabled: boolean) {
  const okBtn = shell.querySelector<HTMLButtonElement>("button.se-ok-btn");
  if (okBtn) okBtn.disabled = disabled;
}/** 通用对话框壳 */
function buildDialogShell(
  i18n: I18n,
  opts: {
    title: string;
    width?: number;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    confirmDisabled?: boolean;
  },
): { shell: HTMLElement; body: HTMLElement } {
  const shell = h("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/30",
  });
  const inner = h("div", {
    className: "flex max-h-[90vh] flex-col overflow-hidden rounded-lg border border-se-border bg-se-canvas shadow-panel",
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
  cancelBtn.textContent = i18n.t("dialog.common.cancel");
  cancelBtn.addEventListener("click", opts.onClose);
  footer.appendChild(cancelBtn);

  if (opts.onConfirm) {
    const okBtn = h("button", {
      type: "button",
      className: "se-ok-btn rounded bg-se-primary px-3 py-1.5 text-[13px] text-white hover:bg-se-primary-text disabled:opacity-50",
    });
    okBtn.textContent = opts.confirmText ?? i18n.t("dialog.common.confirm");
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
  private i18n: I18n;
  private current: HTMLElement | null = null;
  private cleanup: (() => void)[] = [];
  private previousFocus: Element | null = null;

  constructor(editor: Editor, store: UIStore, config: EditorConfig | undefined, i18n: I18n) {
    this.editor = editor;
    this.store = store;
    this.config = config;
    this.i18n = i18n;
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
    // 记录打开前焦点元素，关闭后恢复（仅在首次打开时记录）
    if (this.previousFocus === null) {
      this.previousFocus = document.activeElement;
    }
    let shell: HTMLElement | null = null;
    if (name === "link") shell = this.buildLinkDialog();
    else if (name === "image") shell = this.buildImageDialog();
    else if (name === "file") shell = this.buildFileDialog();
    else if (name === "table") shell = this.buildTableDialog();
    else if (name === "specialChar") shell = this.buildSpecialCharDialog();
    else if (name === "video") shell = this.buildVideoDialog();
    else if (name === "audio") shell = this.buildAudioDialog();
    else if (name === "emoji") shell = this.buildEmojiDialog();
    else if (name === "findReplace") shell = this.buildFindReplaceDialog();
    else if (name === "iframe") shell = this.buildIframeDialog();
    else if (name === "anchor") shell = this.buildAnchorDialog();
    else if (name === "music") shell = this.buildMusicDialog();
    else if (name === "chart") shell = this.buildChartDialog();
    else if (name === "graffiti") shell = this.buildGraffitiDialog();
    else if (name === "remoteImage") shell = this.buildRemoteImageDialog();
    if (!shell) {
      // 未知对话框名：重置 store 以免状态卡死
      this.store.closeDialog();
      return;
    }
    this.current = shell;
    document.body.appendChild(shell);
    this.cleanup.push(onEscape(() => this.close()));
    this.cleanup.push(trapFocus(shell));
  }

  close(): void {
    const hadDialog = this.current !== null;
    this.dispose();
    // 仅在确实关闭了对话框时回写状态，避免 close→closeDialog→close 的回环
    if (hadDialog) {
      this.store.closeDialog();
      // 恢复打开前的焦点
      if (this.previousFocus instanceof HTMLElement && document.body.contains(this.previousFocus)) {
        this.previousFocus.focus();
      }
      this.previousFocus = null;
    }
  }

  private imageCompressOptions(): CompressOptions | undefined {
    const cfg = this.config?.imageCompress;
    if (!cfg) return undefined;
    return cfg === true ? DEFAULT_IMAGE_COMPRESS : cfg;
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

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.link.title"),
      width: DIALOG_WIDTH.link,
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

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !href.trim());
    };

    const hrefInput = buildInput({ value: href, placeholder: this.i18n.t("dialog.link.urlPlaceholder"), autoFocus: true, onInput: (v) => { href = v; refreshConfirmButton(); } });
    body.appendChild(buildField(this.i18n.t("dialog.link.href"), hrefInput));
    const textInput = buildInput({ value: text, placeholder: this.i18n.t("dialog.link.textPlaceholder"), onInput: (v) => { text = v; } });
    body.appendChild(buildField(this.i18n.t("dialog.link.text"), textInput));

    const radioWrap = h("div", { className: "flex gap-4 text-[13px] text-se-ink" });
    const r1 = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="target" ${target === "_blank" ? "checked" : ""}>${this.i18n.t("dialog.link.targetBlank")}</label>`);
    const r2 = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="target" ${target === "_self" ? "checked" : ""}>${this.i18n.t("dialog.link.targetSelf")}</label>`);
    (r1.querySelector("input") as HTMLInputElement).addEventListener("change", () => { target = "_blank"; });
    (r2.querySelector("input") as HTMLInputElement).addEventListener("change", () => { target = "_self"; });
    radioWrap.appendChild(r1);
    radioWrap.appendChild(r2);
    body.appendChild(buildField(this.i18n.t("dialog.link.target"), radioWrap));

    if (this.editor.isActive("link")) {
      const rmBtn = h("button", { type: "button", className: "text-[12px] text-se-primary hover:underline" });
      rmBtn.textContent = this.i18n.t("dialog.link.remove");
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
    let height = "";
    let lockRatio = false;
    let naturalWidth = 0;
    let naturalHeight = 0;
    let align: "left" | "center" | "right" = "center";
    let tab: "upload" | "url" = "upload";
    let uploading = false;

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.image.title"),
      width: DIALOG_WIDTH.image,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        const opts: Record<string, unknown> = { src: url };
        if (alt) opts.alt = alt;
        if (width) opts.width = width;
        if (height) opts.height = height;
        commandRegistry.run(this.editor, "image", opts);
        this.editor.chain().focus().setTextAlign(align).run();
        this.close();
      },
      confirmDisabled: false,
    });

    const renderBody = () => {
      body.innerHTML = "";
      if (this.config?.imageUpload) {
        const tabBar = h("div", { className: "mb-3 flex border-b border-se-border text-[13px]" });
        (["upload", "url"] as const).forEach((t) => {
          const tb = h("button", {
            type: "button",
            className: cn(
              "px-3 py-1.5",
              tab === t ? "border-b-2 border-se-primary text-se-primary-text" : "text-se-sub",
            ),
          });
          tb.textContent = t === "url" ? this.i18n.t("dialog.image.tabUrl") : this.i18n.t("dialog.image.tabUpload");
          tb.addEventListener("click", () => { tab = t; renderBody(); });
          tabBar.appendChild(tb);
        });
        body.appendChild(tabBar);
      }

      const tip = h("div", { className: "mb-3 rounded bg-se-bar px-3 py-2 text-[12px] text-se-sub" });
      if (!this.config?.imageUpload) {
        tip.textContent = this.i18n.t("dialog.image.noUpload");
        body.appendChild(tip);
      }

      if (tab === "url" || !this.config?.imageUpload) {
        // 未配置上传时默认显示网络图片输入，可理解为唯一入口
        if (tab === "upload") tab = "url";
        const urlInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.image.urlPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
        body.appendChild(buildField(this.i18n.t("dialog.image.urlLabel"), urlInput));
        if (src) {
          const previewWrap2 = h("div", { className: "mb-3" });
          const previewImg2 = h("img", {
            src,
            className: "max-h-40 rounded border border-se-border object-contain",
          }) as HTMLImageElement;
          previewImg2.style.display = "block";
          previewImg2.style.maxWidth = "100%";
          previewImg2.onload = () => {
            naturalWidth = previewImg2.naturalWidth;
            naturalHeight = previewImg2.naturalHeight;
          };
          previewWrap2.appendChild(previewImg2);
          body.appendChild(buildField(this.i18n.t("dialog.image.preview"), previewWrap2));
        }
      }

      if (tab === "upload" && this.config?.imageUpload) {
        const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
        fileInput.accept = "image/*";
        // 多图上传：默认开启，可由配置关闭
        if (this.config?.imageMultiUpload !== false) {
          fileInput.multiple = true;
        }
        const statusEl = h("div", { className: "mt-1 text-[12px]" });
        const previewWrap = h("div", { className: "mb-3 hidden" });
        const previewImg = h("img", {
          className: "max-h-40 rounded border border-se-border object-contain",
        }) as HTMLImageElement;
        previewImg.style.display = "block";
        previewImg.style.maxWidth = "100%";
        previewImg.onload = () => {
          naturalWidth = previewImg.naturalWidth;
          naturalHeight = previewImg.naturalHeight;
        };
        previewWrap.appendChild(previewImg);
        const multiTip = h("div", { className: "mb-2 text-[12px] text-se-faint" });
        multiTip.textContent = fileInput.multiple ? this.i18n.t("dialog.image.multiTip") : this.i18n.t("dialog.image.singleTip");
        fileInput.addEventListener("change", async () => {
          const files = Array.from(fileInput.files ?? []);
          if (files.length === 0) return;
          if (!this.config?.imageUpload) {
            statusEl.textContent = this.i18n.t("dialog.image.noUploadAbility");
            statusEl.className = "mt-1 text-[12px] text-red-500";
            return;
          }
          const maxSize = this.config.imageMaxSize ?? DEFAULT_IMAGE_MAX_SIZE;
          const maxSizeMb = Math.round(maxSize / 1024 / 1024);
          // 校验所有文件
          const invalid: string[] = [];
          for (const f of files) {
            if (!f.type.startsWith("image/")) {
              invalid.push(`${f.name} (${this.i18n.t("dialog.image.invalidType")})`);
            } else if (f.size > maxSize) {
              invalid.push(`${f.name} (${this.i18n.t("dialog.image.invalidSize", { size: maxSizeMb })})`);
            }
          }
          if (invalid.length > 0) {
            statusEl.textContent = this.i18n.t("dialog.image.invalid", { list: invalid.join(", ") });
            statusEl.className = "mt-1 text-[12px] text-red-500";
          }

          const validFiles = files.filter(
            (f) => f.type.startsWith("image/") && f.size <= maxSize,
          );
          if (validFiles.length === 0) {
            return;
          }

          // 单图上传时展示本地预览
          if (validFiles.length === 1 && !fileInput.multiple) {
            const url = URL.createObjectURL(validFiles[0]);
            previewImg.src = url;
            previewImg.onload = () => {
              naturalWidth = previewImg.naturalWidth;
              naturalHeight = previewImg.naturalHeight;
              URL.revokeObjectURL(url);
            };
            previewWrap.classList.remove("hidden");
          }

          uploading = true;
          statusEl.textContent = this.i18n.t("dialog.image.uploading", { current: 0, total: validFiles.length });
          statusEl.className = "mt-1 text-[12px] text-se-primary";
          body.appendChild(statusEl);

          // 单图：保持原有行为（切回 URL Tab 让用户继续设置 alt/width/align）
          // 多图：逐张上传后批量插入，关闭对话框
          const isMulti = validFiles.length > 1;
          const compressOpts = this.imageCompressOptions();
          try {
            const uploadFn = this.config.imageUpload;
            if (!uploadFn) throw new Error(this.i18n.t("dialog.image.noUploadAbility"));
            if (!isMulti) {
              const uploadFile = compressOpts ? await compressImage(validFiles[0], compressOpts) : validFiles[0];
              const url = await uploadFn(uploadFile);
              if (!url || typeof url !== "string") {
                throw new Error(this.i18n.t("dialog.image.invalidReturn"));
              }
              src = url;
              previewImg.src = url;
              previewWrap.classList.remove("hidden");
              uploading = false;
              renderBody();
              refreshConfirmButton();
            } else {
              const urls: string[] = [];
              for (let i = 0; i < validFiles.length; i++) {
                statusEl.textContent = this.i18n.t("dialog.image.uploading", { current: i + 1, total: validFiles.length });
                const uploadFile = compressOpts ? await compressImage(validFiles[i], compressOpts) : validFiles[i];
                const url = await uploadFn(uploadFile);
                if (!url || typeof url !== "string") {
                  throw new Error(this.i18n.t("dialog.image.invalidReturnIndex", { index: i + 1 }));
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
            reportError(this.config, "image-upload", err);
            const msg = err instanceof Error ? err.message : String(err);
            statusEl.textContent = this.i18n.t("dialog.image.uploadError", { message: msg });
            statusEl.className = "mt-1 text-[12px] text-red-500";
            uploading = false;
          }
        });
        body.appendChild(buildField(this.i18n.t("dialog.image.fileLabel"), fileInput));
        body.appendChild(multiTip);
        body.appendChild(previewWrap);
        if (uploading) body.appendChild(statusEl);
      }

      const altInput = buildInput({ value: alt, placeholder: this.i18n.t("dialog.image.altPlaceholder"), onInput: (v) => { alt = v; } });
      body.appendChild(buildField(this.i18n.t("dialog.image.altLabel"), altInput));

      const sizeWrap = h("div", { className: "mb-3 flex gap-3" });
      const wInput = buildInput({ value: width, placeholder: this.i18n.t("dialog.image.widthPlaceholder"), onInput: (v) => {
        width = v;
        if (lockRatio && naturalWidth && naturalHeight) {
          const ratio = calcPixelRatio(v, naturalWidth, naturalHeight);
          if (ratio != null) {
            height = ratio;
            hInput.value = height;
          }
        }
      } });
      sizeWrap.appendChild(buildField(this.i18n.t("dialog.image.widthLabel"), wInput));
      const hInput = buildInput({ value: height, placeholder: this.i18n.t("dialog.image.heightPlaceholder"), onInput: (v) => {
        height = v;
        if (lockRatio && naturalWidth && naturalHeight) {
          const ratio = calcPixelRatio(v, naturalHeight, naturalWidth);
          if (ratio != null) {
            width = ratio;
            wInput.value = width;
          }
        }
      } });
      sizeWrap.appendChild(buildField(this.i18n.t("dialog.image.heightLabel"), hInput));
      body.appendChild(sizeWrap);

      const ratioLabel = fromHTML(`<label class="mb-3 flex items-center gap-1.5 text-[13px] text-se-ink"><input type="checkbox" ${lockRatio ? "checked" : ""}>${this.i18n.t("dialog.image.lockRatio")}</label>`);
      (ratioLabel.querySelector("input") as HTMLInputElement).addEventListener("change", (e) => {
        lockRatio = (e.target as HTMLInputElement).checked;
      });
      body.appendChild(ratioLabel);

      const alignWrap = h("div", { className: "flex gap-4 text-[13px] text-se-ink" });
      (["left", "center", "right"] as const).forEach((a) => {
        const label = a === "left" ? this.i18n.t("dialog.image.alignLeft") : a === "center" ? this.i18n.t("dialog.image.alignCenter") : this.i18n.t("dialog.image.alignRight");
        const lbl = fromHTML(`<label class="flex items-center gap-1.5"><input type="radio" name="align" ${align === a ? "checked" : ""}>${label}</label>`);
        (lbl.querySelector("input") as HTMLInputElement).addEventListener("change", () => { align = a; });
        alignWrap.appendChild(lbl);
      });
      body.appendChild(buildField(this.i18n.t("dialog.image.align"), alignWrap));
    };
    renderBody();
    return shell;
  }

  private buildFileDialog(): HTMLElement {
    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.file.title"),
      width: DIALOG_WIDTH.file,
      onClose: () => this.close(),
      onConfirm: () => {
        // 文件对话框的上传是即时的，确定按钮仅用于关闭
        this.close();
      },
      confirmText: this.i18n.t("dialog.file.close"),
      confirmDisabled: false,
    });

    if (!this.config?.fileUpload) {
      const tip = h("div", { className: "py-4 text-center text-[13px] text-se-faint" });
      tip.textContent = this.i18n.t("dialog.file.noUpload");
      body.appendChild(tip);
      return shell;
    }

    const cfg = this.config;
    const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
    const listEl = h("div", { className: "mt-2 flex flex-col gap-1.5" });
    const tip = h("div", { className: "mb-2 text-[12px] text-se-faint" });
    const maxSize = cfg.fileMaxSize ?? DEFAULT_FILE_MAX_SIZE;
    const maxSizeMb = Math.round(maxSize / 1024 / 1024);
    const allowedExts = cfg.fileAllowedExts ?? null;
    tip.textContent = this.i18n.t("dialog.file.sizeLimit", {
      size: maxSizeMb,
      extensions: allowedExts && allowedExts.length > 0 ? this.i18n.t("dialog.file.supportedExts", { extensions: allowedExts.join(", ") }) : "",
    });

    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files ?? []);
      if (files.length === 0) return;
      for (const file of files) {
        const row = h("div", { className: "flex items-center justify-between rounded border border-se-border px-2 py-1.5 text-[12px]" });
        const nameEl = h("span", { className: "flex-1 truncate text-se-ink" });
        nameEl.textContent = file.name;
        const statusEl = h("span", { className: "ml-2 text-se-faint" });
        statusEl.textContent = this.i18n.t("dialog.file.uploading");
        row.appendChild(nameEl);
        row.appendChild(statusEl);
        listEl.appendChild(row);

        // 校验大小
        if (file.size > maxSize) {
          statusEl.textContent = this.i18n.t("dialog.file.oversize", { size: maxSizeMb });
          statusEl.className = "ml-2 text-red-500";
          continue;
        }
        // 校验扩展名
        if (allowedExts && allowedExts.length > 0) {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          if (!allowedExts.includes(ext)) {
            statusEl.textContent = this.i18n.t("dialog.file.unsupportedExt", { ext });
            statusEl.className = "ml-2 text-red-500";
            continue;
          }
        }

        try {
          const uploadFn = cfg.fileUpload;
          if (!uploadFn) throw new Error(this.i18n.t("dialog.file.noUploadAbility"));
          const url = await uploadFn(file);
          if (!url || typeof url !== "string") {
            throw new Error(this.i18n.t("dialog.file.invalidReturn"));
          }
          // 插入文件下载链接
          commandRegistry.run(this.editor, "file", {
            src: url,
            name: file.name,
            download: true,
          });
          statusEl.textContent = this.i18n.t("dialog.file.inserted");
          statusEl.className = "ml-2 text-green-600";
        } catch (err) {
          reportError(this.config, "file-upload", err);
          const msg = err instanceof Error ? err.message : String(err);
          statusEl.textContent = this.i18n.t("dialog.file.failed", { message: msg });
          statusEl.className = "ml-2 text-red-500";
        }
      }
      // 清空 input，允许再次选择同名文件
      fileInput.value = "";
    });

    body.appendChild(buildField(this.i18n.t("dialog.file.fileLabel"), fileInput));
    body.appendChild(tip);
    body.appendChild(listEl);
    return shell;
  }

  private buildTableDialog(): HTMLElement {
    let rows = 3;
    let cols = 3;
    let withHeader = true;
    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.table.title"),
      width: DIALOG_WIDTH.table,
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
    rc.appendChild(buildField(this.i18n.t("dialog.table.rows"), rowInput));
    cc.appendChild(buildField(this.i18n.t("dialog.table.cols"), colInput));
    gap.appendChild(rc);
    gap.appendChild(cc);
    body.appendChild(gap);
    const chk = fromHTML(`<label class="flex items-center gap-1.5 text-[13px] text-se-ink"><input type="checkbox" ${withHeader ? "checked" : ""}>${this.i18n.t("dialog.table.withHeader")}</label>`);
    (chk.querySelector("input") as HTMLInputElement).addEventListener("change", (e) => {
      withHeader = (e.target as HTMLInputElement).checked;
    });
    body.appendChild(buildField(this.i18n.t("dialog.table.header"), chk));
    return shell;
  }

  private buildSpecialCharDialog(): HTMLElement {
    const groups: { labelKey: I18nMessagesKey; chars: string[] }[] = [
      { labelKey: "dialog.specialChar.group.common", chars: ["、", "。", "，", "；", "：", "？", "！", "「", "」", "『", "』", "〈", "〉", "《", "》", "【", "】", "〔", "〕", "—", "…", "·", "～"] },
      { labelKey: "dialog.specialChar.group.math", chars: ["±", "×", "÷", "∈", "∏", "∑", "√", "∝", "∞", "∟", "∠", "∥", "∧", "∨", "∩", "∪", "∫", "∮", "≠", "≤", "≥", "≡", "≈", "⊕"] },
      { labelKey: "dialog.specialChar.group.unit", chars: ["℃", "℉", "‰", "′", "″", "§", "№", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼"] },
      { labelKey: "dialog.specialChar.group.arrow", chars: ["←", "↑", "→", "↓", "↔", "↕", "↖", "↗", "↘", "↙", "⇐", "⇒", "⇔"] },
      { labelKey: "dialog.specialChar.group.greek", chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "ψ", "ω", "Δ", "Σ", "Ω"] },
    ];
    let group = 0;
    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.specialChar.title"),
      width: DIALOG_WIDTH.specialChar,
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
        tb.textContent = this.i18n.t(g.labelKey);
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
      tip.textContent = this.i18n.t("dialog.specialChar.tip");
      body.appendChild(tip);
    };
    render();
    return shell;
  }

  destroy(): void {
    this.close();
  }

  private buildVideoDialog(): HTMLElement {
    let src = "";
    let width = "";
    let tab: "url" | "upload" = "url";
    let uploading = false;

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.video.title"),
      width: DIALOG_WIDTH.video,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        const opts: Record<string, unknown> = { src: url };
        if (width) opts.width = width;
        commandRegistry.run(this.editor, "video", opts);
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const renderBody = () => {
      body.innerHTML = "";
      if (this.config?.fileUpload) {
        const tabBar = h("div", { className: "mb-3 flex border-b border-se-border text-[13px]" });
        (["url", "upload"] as const).forEach((t) => {
          const tb = h("button", {
            type: "button",
            className: cn(
              "px-3 py-1.5",
              tab === t ? "border-b-2 border-se-primary text-se-primary-text" : "text-se-sub",
            ),
          });
          tb.textContent = t === "url" ? this.i18n.t("dialog.video.tabUrl") : this.i18n.t("dialog.video.tabUpload");
          tb.addEventListener("click", () => { tab = t; renderBody(); });
          tabBar.appendChild(tb);
        });
        body.appendChild(tabBar);
      } else {
        const tip = h("div", { className: "mb-3 rounded bg-se-bar px-3 py-2 text-[12px] text-se-sub" });
        tip.textContent = this.i18n.t("dialog.video.noUpload");
        body.appendChild(tip);
      }

      if (tab === "upload") {
        const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
        fileInput.accept = "video/*";
        const statusEl = h("div", { className: "mt-1 text-[12px]" });
        fileInput.addEventListener("change", async () => {
          const files = Array.from(fileInput.files ?? []);
          if (files.length === 0) return;
          if (!this.config?.fileUpload) return;
          uploading = true;
          statusEl.textContent = this.i18n.t("dialog.common.uploading");
          statusEl.className = "mt-1 text-[12px] text-se-primary";
          try {
            const url = await this.config.fileUpload(files[0]);
            src = url;
            tab = "url";
            uploading = false;
            refreshConfirmButton();
            renderBody();
          } catch (err) {
            reportError(this.config, "video-upload", err);
            const msg = err instanceof Error ? err.message : String(err);
            statusEl.textContent = this.i18n.t("dialog.common.uploadError", { message: msg });
            statusEl.className = "mt-1 text-[12px] text-red-500";
            uploading = false;
          }
        });
        body.appendChild(buildField(this.i18n.t("dialog.video.fileLabel"), fileInput));
        if (uploading) body.appendChild(statusEl);
      } else {
        const urlInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.video.urlPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
        body.appendChild(buildField(this.i18n.t("dialog.video.urlLabel"), urlInput));
      }
      const wInput = buildInput({ value: width, placeholder: this.i18n.t("dialog.video.widthPlaceholder"), onInput: (v) => { width = v; } });
      body.appendChild(buildField(this.i18n.t("dialog.video.widthLabel"), wInput));
    };
    renderBody();
    return shell;
  }

  private buildAudioDialog(): HTMLElement {
    let src = "";
    let tab: "url" | "upload" = "url";
    let uploading = false;

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.audio.title"),
      width: DIALOG_WIDTH.audio,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        commandRegistry.run(this.editor, "audio", { src: url });
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const renderBody = () => {
      body.innerHTML = "";
      if (this.config?.fileUpload) {
        const tabBar = h("div", { className: "mb-3 flex border-b border-se-border text-[13px]" });
        (["url", "upload"] as const).forEach((t) => {
          const tb = h("button", {
            type: "button",
            className: cn(
              "px-3 py-1.5",
              tab === t ? "border-b-2 border-se-primary text-se-primary-text" : "text-se-sub",
            ),
          });
          tb.textContent = t === "url" ? this.i18n.t("dialog.audio.tabUrl") : this.i18n.t("dialog.audio.tabUpload");
          tb.addEventListener("click", () => { tab = t; renderBody(); });
          tabBar.appendChild(tb);
        });
        body.appendChild(tabBar);
      } else {
        const tip = h("div", { className: "mb-3 rounded bg-se-bar px-3 py-2 text-[12px] text-se-sub" });
        tip.textContent = this.i18n.t("dialog.audio.noUpload");
        body.appendChild(tip);
      }

      if (tab === "upload") {
        const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
        fileInput.accept = "audio/*";
        const statusEl = h("div", { className: "mt-1 text-[12px]" });
        fileInput.addEventListener("change", async () => {
          const files = Array.from(fileInput.files ?? []);
          if (files.length === 0) return;
          if (!this.config?.fileUpload) return;
          uploading = true;
          statusEl.textContent = this.i18n.t("dialog.common.uploading");
          statusEl.className = "mt-1 text-[12px] text-se-primary";
          try {
            const url = await this.config.fileUpload(files[0]);
            src = url;
            tab = "url";
            uploading = false;
            refreshConfirmButton();
            renderBody();
          } catch (err) {
            reportError(this.config, "audio-upload", err);
            const msg = err instanceof Error ? err.message : String(err);
            statusEl.textContent = this.i18n.t("dialog.common.uploadError", { message: msg });
            statusEl.className = "mt-1 text-[12px] text-red-500";
            uploading = false;
          }
        });
        body.appendChild(buildField(this.i18n.t("dialog.audio.fileLabel"), fileInput));
        if (uploading) body.appendChild(statusEl);
      } else {
        const urlInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.audio.urlPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
        body.appendChild(buildField(this.i18n.t("dialog.audio.urlLabel"), urlInput));
      }
    };
    renderBody();
    return shell;
  }

  private buildEmojiDialog(): HTMLElement {
    const groups: { labelKey: I18nMessagesKey; chars: string[] }[] = [
      { labelKey: "dialog.emoji.group.emoji", chars: ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗", "🙁", "😐", "😶", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲"] },
      { labelKey: "dialog.emoji.group.gesture", chars: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🙏", "👏", "🙌", "👐", "🤲"] },
      { labelKey: "dialog.emoji.group.animal", chars: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴", "🦄"] },
      { labelKey: "dialog.emoji.group.food", chars: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥕", "🌽", "🌶️", "🥔", "🍠"] },
      { labelKey: "dialog.emoji.group.object", chars: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "⭐", "🌟", "✨", "⚡", "💥"] },
    ];
    let group = 0;
    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.emoji.title"),
      width: DIALOG_WIDTH.emoji,
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
        tb.textContent = this.i18n.t(g.labelKey);
        tb.addEventListener("click", () => { group = i; render(); });
        tabBar.appendChild(tb);
      });
      body.appendChild(tabBar);
      const grid = h("div", { className: "grid grid-cols-8 gap-1" });
      groups[group].chars.forEach((c) => {
        const btn = h("button", {
          type: "button",
          className: "flex h-8 items-center justify-center rounded border border-se-border text-[18px] hover:border-se-primary hover:bg-se-active",
        });
        btn.textContent = c;
        btn.addEventListener("click", () => {
          commandRegistry.run(this.editor, "specialChar", c);
        });
        grid.appendChild(btn);
      });
      body.appendChild(grid);
    };
    render();
    return shell;
  }

  private buildFindReplaceDialog(): HTMLElement {
    let findText = "";
    let replaceText = "";
    let matchCase = false;
    let currentIndex = -1;
    const matches: { from: number; to: number }[] = [];

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.findReplace.title"),
      width: DIALOG_WIDTH.findReplace,
      onClose: () => this.close(),
    });

    const findInput = buildInput({
      value: findText,
      placeholder: this.i18n.t("dialog.findReplace.findPlaceholder"),
      autoFocus: true,
      onInput: (v) => { findText = v; },
    });
    const replaceInput = buildInput({
      value: replaceText,
      placeholder: this.i18n.t("dialog.findReplace.replacePlaceholder"),
      onInput: (v) => { replaceText = v; },
    });

    body.appendChild(buildField(this.i18n.t("dialog.findReplace.find"), findInput));
    body.appendChild(buildField(this.i18n.t("dialog.findReplace.replace"), replaceInput));

    const caseChk = fromHTML(`<label class="flex items-center gap-1.5 text-[13px] text-se-ink"><input type="checkbox">${this.i18n.t("dialog.findReplace.matchCase")}</label>`);
    (caseChk.querySelector("input") as HTMLInputElement).addEventListener("change", (e) => {
      matchCase = (e.target as HTMLInputElement).checked;
    });
    body.appendChild(caseChk);

    const statusEl = h("div", { className: "mt-2 text-[12px] text-se-faint" });
    body.appendChild(statusEl);

    const collectMatches = () => {
      matches.length = 0;
      currentIndex = -1;
      const kw = findText;
      if (!kw) {
        statusEl.textContent = "";
        return;
      }
      const doc = this.editor.state.doc;
      const flags = matchCase ? "g" : "gi";
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        let m: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((m = re.exec(node.text)) !== null) {
          const from = pos + m.index;
          const to = from + m[0].length;
          matches.push({ from, to });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      });
      statusEl.textContent = matches.length > 0 ? this.i18n.t("dialog.findReplace.found", { count: matches.length }) : this.i18n.t("dialog.findReplace.notFound");
    };

    const highlightMatch = (idx: number) => {
      if (idx < 0 || idx >= matches.length) return;
      const m = matches[idx];
      this.editor.chain().focus().setTextSelection({ from: m.from, to: m.to }).run();
      // 滚动到选区
      const view = this.editor.view;
      view.dispatch(view.state.tr.scrollIntoView());
      statusEl.textContent = this.i18n.t("dialog.findReplace.current", { current: idx + 1, total: matches.length });
    };

    const findNext = () => {
      collectMatches();
      if (matches.length === 0) return;
      // 找到第一个在当前选区之后的匹配，否则回到第一个
      const sel = this.editor.state.selection;
      let next = matches.findIndex((m) => m.from > sel.to);
      if (next < 0) next = 0;
      currentIndex = next;
      highlightMatch(currentIndex);
    };

    const replaceCurrent = () => {
      collectMatches();
      if (matches.length === 0) return;
      if (currentIndex < 0) {
        // 没有当前选中匹配，从第一个开始
        currentIndex = 0;
        highlightMatch(0);
        return;
      }
      const m = matches[currentIndex];
      if (!m) return;
      const tr = this.editor.state.tr;
      tr.replaceWith(m.from, m.to, replaceText ? this.editor.state.schema.text(replaceText) : []);
      this.editor.view.dispatch(tr);
      // 替换后重新收集并高亮下一个
      collectMatches();
      if (matches.length === 0) {
        currentIndex = -1;
        statusEl.textContent = this.i18n.t("dialog.findReplace.allDone");
        return;
      }
      if (currentIndex >= matches.length) currentIndex = 0;
      highlightMatch(currentIndex);
    };

    const replaceAll = () => {
      collectMatches();
      if (matches.length === 0) return;
      // 从后往前替换，避免位置偏移
      let count = 0;
      const sorted = [...matches].sort((a, b) => b.from - a.from);
      sorted.forEach((m) => {
        const tr = this.editor.state.tr;
        tr.replaceWith(m.from, m.to, replaceText ? this.editor.state.schema.text(replaceText) : []);
        this.editor.view.dispatch(tr);
        count++;
      });
      statusEl.textContent = this.i18n.t("dialog.findReplace.replacedAll", { count });
      matches.length = 0;
      currentIndex = -1;
    };

    const btnRow = h("div", { className: "mt-3 flex flex-wrap gap-2" });
    const makeBtn = (label: string, onClick: () => void, primary = false): HTMLButtonElement => {
      const b = h("button", {
        type: "button",
        className: cn(
          "rounded px-3 py-1.5 text-[13px]",
          primary
            ? "bg-se-primary text-white hover:bg-se-primary-text"
            : "border border-se-border bg-white text-se-ink hover:bg-se-hover",
        ),
      });
      b.textContent = label;
      b.addEventListener("click", onClick);
      return b;
    };
    btnRow.appendChild(makeBtn(this.i18n.t("dialog.findReplace.findNext"), findNext));
    btnRow.appendChild(makeBtn(this.i18n.t("dialog.findReplace.replaceBtn"), replaceCurrent));
    btnRow.appendChild(makeBtn(this.i18n.t("dialog.findReplace.replaceAll"), replaceAll, true));
    body.appendChild(btnRow);

    return shell;
  }

  private buildIframeDialog(): HTMLElement {
    let src = "";
    let width = "100%";
    let height = "300";

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.iframe.title"),
      width: DIALOG_WIDTH.iframe,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        commandRegistry.run(this.editor, "iframe", { src: url, width, height });
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const srcInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.iframe.srcPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
    body.appendChild(buildField(this.i18n.t("dialog.iframe.src"), srcInput));
    const wInput = buildInput({ value: width, placeholder: this.i18n.t("dialog.iframe.widthPlaceholder"), onInput: (v) => { width = v; } });
    body.appendChild(buildField(this.i18n.t("dialog.iframe.width"), wInput));
    const hInput = buildInput({ value: height, placeholder: this.i18n.t("dialog.iframe.heightPlaceholder"), onInput: (v) => { height = v; } });
    body.appendChild(buildField(this.i18n.t("dialog.iframe.height"), hInput));

    return shell;
  }

  private buildAnchorDialog(): HTMLElement {
    let id = "";
    let name = "";

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.anchor.title"),
      width: DIALOG_WIDTH.anchor,
      onClose: () => this.close(),
      onConfirm: () => {
        const anchorId = id.trim();
        if (!anchorId) return;
        commandRegistry.run(this.editor, "anchor", { id: anchorId, name: name.trim() || anchorId });
        this.close();
      },
      confirmDisabled: !id.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !id.trim());
    };

    const idInput = buildInput({ value: id, placeholder: this.i18n.t("dialog.anchor.idPlaceholder"), autoFocus: true, onInput: (v) => { id = v; refreshConfirmButton(); } });
    body.appendChild(buildField(this.i18n.t("dialog.anchor.id"), idInput));
    const nameInput = buildInput({ value: name, placeholder: this.i18n.t("dialog.anchor.namePlaceholder"), onInput: (v) => { name = v; } });
    body.appendChild(buildField(this.i18n.t("dialog.anchor.name"), nameInput));

    return shell;
  }

  private buildMusicDialog(): HTMLElement {
    let src = "";
    let name = "";
    let artist = "";
    let tab: "url" | "upload" = "url";
    let uploading = false;

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.music.title"),
      width: DIALOG_WIDTH.music,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        commandRegistry.run(this.editor, "music", {
          src: url,
          name: name.trim(),
          artist: artist.trim(),
        });
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const renderBody = () => {
      body.innerHTML = "";
      if (this.config?.fileUpload) {
        const tabBar = h("div", { className: "mb-3 flex border-b border-se-border text-[13px]" });
        (["url", "upload"] as const).forEach((t) => {
          const tb = h("button", {
            type: "button",
            className: cn(
              "px-3 py-1.5",
              tab === t ? "border-b-2 border-se-primary text-se-primary-text" : "text-se-sub",
            ),
          });
          tb.textContent = t === "url" ? this.i18n.t("dialog.music.tabUrl") : this.i18n.t("dialog.music.tabUpload");
          tb.addEventListener("click", () => { tab = t; renderBody(); });
          tabBar.appendChild(tb);
        });
        body.appendChild(tabBar);
      } else {
        const tip = h("div", { className: "mb-3 rounded bg-se-bar px-3 py-2 text-[12px] text-se-sub" });
        tip.textContent = this.i18n.t("dialog.music.noUpload");
        body.appendChild(tip);
      }

      if (tab === "upload") {
        const fileInput = h("input", { type: "file", className: "text-[12px] text-se-sub" }) as HTMLInputElement;
        fileInput.accept = "audio/*";
        const statusEl = h("div", { className: "mt-1 text-[12px]" });
        fileInput.addEventListener("change", async () => {
          const files = Array.from(fileInput.files ?? []);
          if (files.length === 0) return;
          if (!this.config?.fileUpload) return;
          uploading = true;
          statusEl.textContent = this.i18n.t("dialog.common.uploading");
          statusEl.className = "mt-1 text-[12px] text-se-primary";
          try {
            const url = await this.config.fileUpload(files[0]);
            src = url;
            tab = "url";
            uploading = false;
            refreshConfirmButton();
            renderBody();
          } catch (err) {
            reportError(this.config, "music-upload", err);
            const msg = err instanceof Error ? err.message : String(err);
            statusEl.textContent = this.i18n.t("dialog.common.uploadError", { message: msg });
            statusEl.className = "mt-1 text-[12px] text-red-500";
            uploading = false;
          }
        });
        body.appendChild(buildField(this.i18n.t("dialog.music.fileLabel"), fileInput));
        if (uploading) body.appendChild(statusEl);
      } else {
        const urlInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.music.urlPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
        body.appendChild(buildField(this.i18n.t("dialog.music.urlLabel"), urlInput));
        const nameInput = buildInput({ value: name, placeholder: this.i18n.t("dialog.music.namePlaceholder"), onInput: (v) => { name = v; } });
        body.appendChild(buildField(this.i18n.t("dialog.music.name"), nameInput));
        const artistInput = buildInput({ value: artist, placeholder: this.i18n.t("dialog.music.artistPlaceholder"), onInput: (v) => { artist = v; } });
        body.appendChild(buildField(this.i18n.t("dialog.music.artist"), artistInput));
      }
    };
    renderBody();
    return shell;
  }

  private buildChartDialog(): HTMLElement {
    let type: "bar" | "line" | "pie" = "bar";
    let title = "";
    let labels = "";
    let values = "";
    let colors = "";

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.chart.title"),
      width: DIALOG_WIDTH.chart,
      onClose: () => this.close(),
      onConfirm: () => {
        if (!values.trim()) return;
        commandRegistry.run(this.editor, "chart", { type, title: title.trim(), labels, values, colors });
        this.close();
      },
      confirmDisabled: !values.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !values.trim());
    };

    const typeSelect = h("select", { className: inputClass }) as HTMLSelectElement;
    (["bar", "line", "pie"] as const).forEach((t) => {
      const opt = h("option") as HTMLOptionElement;
      opt.value = t;
      opt.textContent = t === "bar" ? this.i18n.t("dialog.chart.typeBar") : t === "line" ? this.i18n.t("dialog.chart.typeLine") : this.i18n.t("dialog.chart.typePie");
      typeSelect.appendChild(opt);
    });
    typeSelect.addEventListener("change", () => { type = typeSelect.value as "bar" | "line" | "pie"; });
    body.appendChild(buildField(this.i18n.t("dialog.chart.type"), typeSelect));

    body.appendChild(buildField(this.i18n.t("dialog.chart.titleLabel"), buildInput({ value: title, placeholder: this.i18n.t("dialog.chart.titlePlaceholder"), onInput: (v) => { title = v; } })));
    body.appendChild(buildField(this.i18n.t("dialog.chart.labels"), buildInput({ value: labels, placeholder: this.i18n.t("dialog.chart.labelsPlaceholder"), onInput: (v) => { labels = v; } })));
    body.appendChild(buildField(this.i18n.t("dialog.chart.values"), buildInput({ value: values, placeholder: this.i18n.t("dialog.chart.valuesPlaceholder"), autoFocus: true, onInput: (v) => { values = v; refreshConfirmButton(); } })));
    body.appendChild(buildField(this.i18n.t("dialog.chart.colors"), buildInput({ value: colors, placeholder: this.i18n.t("dialog.chart.colorsPlaceholder"), onInput: (v) => { colors = v; } })));

    return shell;
  }

  private buildGraffitiDialog(): HTMLElement {
    let color = "#000000";
    let lineWidth = 4;
    let dataUrl = "";
    const width = 600;
    const height = 300;

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.graffiti.title"),
      width: DIALOG_WIDTH.graffiti,
      onClose: () => this.close(),
      onConfirm: () => {
        if (dataUrl) commandRegistry.run(this.editor, "graffiti", dataUrl);
        this.close();
      },
      confirmDisabled: false,
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !dataUrl);
    };

    const canvas = h("canvas", { className: "border border-se-border bg-white cursor-crosshair" }) as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    let drawing = false;
    const getPos = (e: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const startDraw = (e: MouseEvent) => {
      drawing = true;
      if (!ctx) return;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const moveDraw = (e: MouseEvent) => {
      if (!drawing || !ctx) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const endDraw = () => {
      if (!drawing) return;
      drawing = false;
      dataUrl = canvas.toDataURL("image/png");
      refreshConfirmButton();
    };
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    const touchStart = (e: TouchEvent) => {
      e.preventDefault();
      drawing = true;
      if (!ctx) return;
      const p = getPos(e.touches[0]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const touchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing || !ctx) return;
      const p = getPos(e.touches[0]);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const touchEnd = () => {
      drawing = false;
      dataUrl = canvas.toDataURL("image/png");
      refreshConfirmButton();
    };
    canvas.addEventListener("touchstart", touchStart);
    canvas.addEventListener("touchmove", touchMove);
    canvas.addEventListener("touchend", touchEnd);

    const tools = h("div", { className: "mb-3 flex items-center gap-3" });
    const colorInput = h("input", { type: "color", className: "h-8 w-8 rounded border border-se-border" }) as HTMLInputElement;
    colorInput.value = color;
    colorInput.addEventListener("input", () => {
      color = colorInput.value;
      if (ctx) ctx.strokeStyle = color;
    });
    const sizeInput = h("input", { type: "range", min: "1", max: "20", value: String(lineWidth) }) as HTMLInputElement;
    sizeInput.addEventListener("input", () => {
      lineWidth = Number(sizeInput.value);
      if (ctx) ctx.lineWidth = lineWidth;
    });
    const clearBtn = h("button", {
      type: "button",
      className: "rounded border border-se-border bg-white px-3 py-1 text-[13px] text-se-sub hover:bg-se-hover",
    });
    clearBtn.textContent = this.i18n.t("dialog.graffiti.clear");
    clearBtn.addEventListener("click", () => {
      if (ctx) ctx.clearRect(0, 0, width, height);
      dataUrl = "";
      refreshConfirmButton();
    });
    tools.appendChild(colorInput);
    tools.appendChild(sizeInput);
    tools.appendChild(clearBtn);

    body.appendChild(tools);
    body.appendChild(canvas);
    return shell;
  }

  private buildRemoteImageDialog(): HTMLElement {
    let src = "";

    const { shell, body } = buildDialogShell(this.i18n, {
      title: this.i18n.t("dialog.remoteImage.title"),
      width: DIALOG_WIDTH.remoteImage,
      onClose: () => this.close(),
      onConfirm: () => {
        const url = src.trim();
        if (!url) return;
        commandRegistry.run(this.editor, "remoteImage", url);
        this.close();
      },
      confirmDisabled: !src.trim(),
    });

    const refreshConfirmButton = () => {
      setOkDisabled(shell, !src.trim());
    };

    const urlInput = buildInput({ value: src, placeholder: this.i18n.t("dialog.remoteImage.urlPlaceholder"), autoFocus: true, onInput: (v) => { src = v; refreshConfirmButton(); } });
    body.appendChild(buildField(this.i18n.t("dialog.remoteImage.urlLabel"), urlInput));
    const tip = h("div", { className: "mt-2 text-[12px] text-se-faint" });
    tip.textContent = this.i18n.t("dialog.remoteImage.tip");
    body.appendChild(tip);

    return shell;
  }
}
