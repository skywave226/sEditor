/**
 * 内联 SVG 图标（替代 lucide-react）。
 * 所有图标返回 16x16 SVG 字符串，stroke-width=2，可复用。
 */

const wrap = (path: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

export const icons: Record<string, string> = {
  undo: wrap('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'),
  redo: wrap('<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>'),
  bold: wrap('<path d="M6 12h8a4 4 0 0 0 0-8H6v8z"/><path d="M6 12h9a4 4 0 0 1 0 8H6v-8z"/>'),
  italic: wrap('<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>'),
  underline: wrap('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>'),
  strike: wrap('<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>'),
  alignLeft: wrap('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>'),
  alignCenter: wrap('<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="5" y1="18" x2="19" y2="18"/>'),
  alignRight: wrap('<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>'),
  alignJustify: wrap('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'),
  list: wrap('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),
  listOrdered: wrap('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  indentIncrease: wrap('<polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/>'),
  indentDecrease: wrap('<polyline points="11 8 7 12 11 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/>'),
  quote: wrap('<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'),
  code: wrap('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  code2: wrap('<rect width="16" height="20" x="4" y="2" rx="2"/><path d="m9 16 3-4 3 4"/><line x1="9" y1="9" x2="15" y2="9"/>'),
  link: wrap('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  image: wrap('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>'),
  file: wrap('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>'),
  table: wrap('<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>'),
  minus: wrap('<line x1="5" y1="12" x2="19" y2="12"/>'),
  eraser: wrap('<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>'),
  copy: wrap('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  scissors: wrap('<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>'),
  clipboardPaste: wrap('<path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/>'),
  trash: wrap('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  rowTop: wrap('<rect width="18" height="4" x="3" y="3" rx="1"/><path d="M6 11h12"/><path d="M6 15h12"/><path d="M6 19h12"/><path d="M3 13v6l2-2"/>'),
  rowBottom: wrap('<rect width="18" height="4" x="3" y="17" rx="1"/><path d="M6 5h12"/><path d="M6 9h12"/><path d="M6 13h12"/><path d="M3 5v6l2-2"/>'),
  colLeft: wrap('<rect width="4" height="18" x="3" y="3" rx="1"/><path d="M11 6v12"/><path d="M15 6v12"/><path d="M19 6v12"/><path d="M5 3h6l-2-2"/>'),
  colRight: wrap('<rect width="4" height="18" x="17" y="3" rx="1"/><path d="M5 6v12"/><path d="M9 6v12"/><path d="M13 6v12"/><path d="M13 3h6l-2-2"/>'),
  merge: wrap('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v6"/><path d="M15 9v6"/><path d="M9 15v6"/>'),
  split: wrap('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/>'),
  tableHeader: wrap('<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3z" fill="currentColor" stroke="none"/>'),
  trashTable: wrap('<path d="M3 6h18"/><path d="M5 6l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="3" y1="3" x2="21" y2="21"/>'),
  edit: wrap('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  unlink: wrap('<path d="M18.84 12.25l1.72-1.71a4 4 0 0 0-5.66-5.66l-3.91 3.91"/><path d="M5.16 11.75l-1.72 1.71a4 4 0 0 0 5.66 5.66l3.91-3.91"/><line x1="2" y1="2" x2="22" y2="22"/>'),
  maximize: wrap('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  caseSensitive: wrap('<path d="m6 4 6 14"/><path d="m18 4-6 14"/><path d="M4 12h12"/>'),
  chevronDown: wrap('<polyline points="6 9 12 15 18 9"/>'),
  check: wrap('<polyline points="20 6 9 17 4 12"/>'),
  x: wrap('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  baseline: wrap('<path d="M4 20h16"/><path d="M6 16h12"/><path d="M12 4v12"/><path d="M8 8l4-4 4 4"/>'),
  highlighter: wrap('<path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>'),
  pasteText: wrap('<path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>'),
  emoji: wrap('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
  search: wrap('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  replace: wrap('<path d="M14 4c0-1.1.9-2 2-2"/><path d="M20 8c0 1.1-.9 2-2 2"/><path d="M18 2c1.1 0 2 .9 2 2"/><path d="M18 4c-1.1 0-2 .9-2 2"/><path d="M14 20c0 1.1.9 2 2 2"/><path d="M20 16c0-1.1-.9-2-2-2"/><path d="M18 22c1.1 0 2-.9 2-2"/><path d="M18 20c-1.1 0-2-.9-2-2"/><path d="M4 8h10"/><path d="M11 5l3 3-3 3"/>'),
  video: wrap('<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>'),
  audio: wrap('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  save: wrap('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
  history: wrap('<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>'),
  subscript: wrap('<path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4v-2h4"/>'),
  superscript: wrap('<path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 7h-4V5h4"/>'),
  selectAll: wrap('<path d="M7 3h10"/><path d="M7 21h10"/><path d="M3 7v10"/><path d="M21 7v10"/><rect width="10" height="10" x="7" y="7" rx="1"/>'),
  clearDocument: wrap('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  clock: wrap('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  calendar: wrap('<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  printer: wrap('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14" rx="2"/>'),
  eye: wrap('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
  codeLanguage: wrap('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="3" x2="12" y2="21"/>'),
};

/** 获取图标 SVG 字符串 */
export function getIcon(name: string): string {
  return icons[name] ?? "";
}
