import type { Editor } from "@tiptap/core";
import type { DialogType } from "../types";
import { toolbarGroups } from "./config";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarDivider } from "./ToolbarDivider";
import { HeadingDropdown } from "./dropdowns/HeadingDropdown";
import { FontFamilyDropdown } from "./dropdowns/FontFamilyDropdown";
import { FontSizeDropdown } from "./dropdowns/FontSizeDropdown";
import { ColorDropdown } from "./dropdowns/ColorDropdown";
import { HighlightDropdown } from "./dropdowns/HighlightDropdown";
import { LineHeightDropdown } from "./dropdowns/LineHeightDropdown";
import { commandRegistry } from "../commands/registry";
import { useEditorState } from "../hooks/useEditorState";
import { useEditorStore } from "../store";

const DIALOG_COMMANDS = new Set(["link", "image", "table", "specialChar"]);

interface ToolbarProps {
  editor: Editor;
}

export function Toolbar({ editor }: ToolbarProps) {
  useEditorState(editor);
  const openDialog = useEditorStore((s) => s.openDialog);
  const toggleSource = useEditorStore((s) => s.toggleSource);
  const toggleFullscreen = useEditorStore((s) => s.toggleFullscreen);
  const isSourceMode = useEditorStore((s) => s.isSourceMode);
  const isFullscreen = useEditorStore((s) => s.isFullscreen);

  const handleButton = (command: string) => {
    if (command === "__source__") return toggleSource();
    if (command === "__fullscreen__") return toggleFullscreen();
    if (DIALOG_COMMANDS.has(command)) return openDialog(command as Exclude<DialogType, null>);
    commandRegistry.run(editor, command);
  };

  const renderDropdown = (id: string, kind: string) => {
    switch (kind) {
      case "heading":
        return <HeadingDropdown editor={editor} />;
      case "fontFamily":
        return <FontFamilyDropdown editor={editor} />;
      case "fontSize":
        return <FontSizeDropdown editor={editor} />;
      case "color":
        return <ColorDropdown editor={editor} />;
      case "highlight":
        return <HighlightDropdown editor={editor} />;
      case "lineHeight":
        return <LineHeightDropdown editor={editor} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-ue-border bg-ue-bar px-2 py-1.5">
      {toolbarGroups.map((group, gi) => (
        <div key={`g-${gi}`} className="flex items-center gap-0.5">
          {gi > 0 && <ToolbarDivider />}
          {group.map((item) => {
            if (item.type === "divider") return <ToolbarDivider key={item.id} />;
            if (item.type === "dropdown")
              return <div key={item.id}>{renderDropdown(item.id, item.dropdown)}</div>;
            const active =
              item.command === "__source__"
                ? isSourceMode
                : item.command === "__fullscreen__"
                  ? isFullscreen
                  : commandRegistry.isActive(editor, item.command);
            const disabled =
              !commandRegistry.can(editor, item.command) &&
              item.command !== "__source__" &&
              item.command !== "__fullscreen__" &&
              !DIALOG_COMMANDS.has(item.command);
            return (
              <ToolbarButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={active}
                disabled={disabled}
                onClick={() => handleButton(item.command)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
