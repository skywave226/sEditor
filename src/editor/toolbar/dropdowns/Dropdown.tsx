import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  /** 触发器展示文本 */
  label: string;
  /** 触发器宽度 */
  width?: number;
  /** 是否激活态 */
  active?: boolean;
  /** 触发器前置图标 */
  icon?: ReactNode;
  /** 面板内容，close 用于关闭面板 */
  children: (close: () => void) => ReactNode;
  /** 面板最小宽度 */
  panelMinWidth?: number;
}

export function Dropdown({
  label,
  width,
  active,
  icon,
  children,
  panelMinWidth,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 items-center gap-1 rounded px-2 text-[13px] text-ue-ink transition-colors",
          "hover:bg-ue-hover",
          active && "bg-ue-active text-ue-primary-text hover:bg-ue-active",
          open && "bg-ue-hover",
        )}
        style={width ? { width } : undefined}
      >
        {icon}
        <span className="truncate">{label}</span>
        <ChevronDown size={13} className="shrink-0 text-ue-faint" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-9 z-50 rounded-md border border-ue-border bg-white shadow-dropdown"
          style={{ minWidth: panelMinWidth ?? width ?? 120 }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
