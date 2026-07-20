/**
 * 原生 DOM 工具函数（替代 React JSX + cn）。
 */

/** 拼接 className（过滤 falsy 值），简化版 cn */
export function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

/** 创建元素 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]> & {
    className?: string;
    innerHTML?: string;
    title?: string;
    dataset?: Record<string, string>;
    onClick?: (e: MouseEvent) => void;
    onInput?: (e: Event) => void;
    onChange?: (e: Event) => void;
  },
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "className") {
        el.className = v as string;
      } else if (k === "innerHTML") {
        el.innerHTML = v as string;
      } else if (k === "dataset") {
        for (const [dk, dv] of Object.entries(v as Record<string, string>)) {
          el.dataset[dk] = dv;
        }
      } else if (k === "onClick") {
        el.addEventListener("click", v as EventListener);
      } else if (k === "onInput") {
        el.addEventListener("input", v as EventListener);
      } else if (k === "onChange") {
        el.addEventListener("change", v as EventListener);
      } else if (k === "title") {
        el.title = v as string;
      } else if (k in el) {
        (el as Record<string, unknown>)[k] = v;
      }
    }
  }
  if (children) {
    for (const c of children) {
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
  }
  return el;
}

/** 从 HTML 字符串创建元素；若解析不到元素节点则返回空 span 兜底 */
export function fromHTML(html: string): HTMLElement {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  const el = tpl.content.firstElementChild;
  if (!el) {
    // 兜底：返回空 span，避免调用方 .appendChild / .addEventListener 触发 NPE
    return document.createElement("span");
  }
  return el as HTMLElement;
}

/** 绑定外部点击关闭 */
export function onClickOutside(
  el: HTMLElement,
  handler: () => void,
): () => void {
  const onDown = (e: MouseEvent) => {
    if (!el.contains(e.target as Node)) handler();
  };
  document.addEventListener("mousedown", onDown);
  return () => document.removeEventListener("mousedown", onDown);
}

/** 绑定 Escape 关闭 */
export function onEscape(handler: () => void): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") handler();
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

const FOCUSABLE_SELECTORS = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 获取容器内所有可获得焦点的元素 */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.offsetParent !== null,
  );
}

/**
 * 焦点陷阱：限制 Tab / Shift+Tab 仅在容器内循环，并在初始化时聚焦第一个可聚焦元素。
 * 返回清理函数。
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusables = getFocusable(container);
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const list = getFocusable(container);
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}
