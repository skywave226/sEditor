import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** 前置色块/示例字体 */
  leading?: ReactNode;
}

export function MenuItem({ label, active, onClick, leading }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ue-ink",
        "hover:bg-ue-hover",
        active && "text-ue-primary-text",
      )}
    >
      {leading}
      <span className="flex-1 truncate">{label}</span>
      {active && <Check size={14} className="text-ue-primary" />}
    </button>
  );
}
