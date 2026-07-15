import type { ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
  width?: number;
}

export function Dialog({
  title,
  onClose,
  onConfirm,
  onCancel,
  confirmText = "确定",
  cancelText = "取消",
  confirmDisabled,
  children,
  width = 420,
}: DialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      onMouseDown={onCancel ?? onClose}
    >
      <div
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-lg border border-ue-border bg-white shadow-panel"
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ue-border bg-ue-bar px-4 py-2.5">
          <span className="text-[14px] font-medium text-ue-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-ue-faint hover:text-ue-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-ue-border bg-ue-bar px-4 py-2.5">
          <button
            type="button"
            onClick={onCancel ?? onClose}
            className="rounded border border-ue-border bg-white px-3 py-1.5 text-[13px] text-ue-sub hover:bg-ue-hover"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="rounded bg-ue-primary px-3 py-1.5 text-[13px] text-white hover:bg-ue-primary-text disabled:opacity-50"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 表单字段标签 + 控件行 */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[12px] text-ue-sub">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-ue-border px-2.5 py-1.5 text-[13px] text-ue-ink outline-none focus:border-ue-primary";
