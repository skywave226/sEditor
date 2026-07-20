import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setParagraphSpacingBefore: (spacing: string) => ReturnType;
      setParagraphSpacingAfter: (spacing: string) => ReturnType;
      unsetParagraphSpacingBefore: () => ReturnType;
      unsetParagraphSpacingAfter: () => ReturnType;
    };
  }
}

export interface ParagraphSpacingOptions {
  types: string[];
}

export const ParagraphSpacing = Extension.create<ParagraphSpacingOptions>({
  name: "paragraphSpacing",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          paragraphSpacingBefore: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.marginTop || null,
            renderHTML: (attrs) => {
              if (!attrs.paragraphSpacingBefore) return {};
              return { style: `margin-top: ${attrs.paragraphSpacingBefore}` };
            },
          },
          paragraphSpacingAfter: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.marginBottom || null,
            renderHTML: (attrs) => {
              if (!attrs.paragraphSpacingAfter) return {};
              return { style: `margin-bottom: ${attrs.paragraphSpacingAfter}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacingBefore:
        (spacing) =>
        ({ commands }) =>
          this.options.types.every((t) => commands.updateAttributes(t, { paragraphSpacingBefore: spacing })),
      setParagraphSpacingAfter:
        (spacing) =>
        ({ commands }) =>
          this.options.types.every((t) => commands.updateAttributes(t, { paragraphSpacingAfter: spacing })),
      unsetParagraphSpacingBefore:
        () =>
        ({ commands }) =>
          this.options.types.every((t) => commands.resetAttributes(t, "paragraphSpacingBefore")),
      unsetParagraphSpacingAfter:
        () =>
        ({ commands }) =>
          this.options.types.every((t) => commands.resetAttributes(t, "paragraphSpacingAfter")),
    };
  },
});
