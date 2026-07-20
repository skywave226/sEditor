import { Node } from "@tiptap/core";
import { escapeXml } from "./sanitize";
import { CHART_DEFAULTS } from "../constants";

export type ChartType = "bar" | "line" | "pie";

export interface ChartOptions {
  type?: ChartType;
  title?: string;
  labels: string;
  values: string;
  colors?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    chart: {
      insertChart: (options: ChartOptions) => ReturnType;
    };
  }
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function parseValues(values: string): number[] {
  return values
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

function parseLabels(labels: string): string[] {
  return labels.split(",").map((s) => s.trim());
}

function generateChartSvg(
  type: ChartType,
  title: string,
  labels: string[],
  values: number[],
  colors: string[],
): string {
  const width = CHART_DEFAULTS.width;
  const height = CHART_DEFAULTS.height;
  const pad = CHART_DEFAULTS.pad;
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const palette = colors.length ? colors : DEFAULT_COLORS;

  let content = "";
  if (type === "bar") {
    const slot = values.length > 0 ? chartW / values.length : chartW;
    const barW = Math.max(8, slot * 0.6);
    values.forEach((v, i) => {
      const h = (v / max) * chartH;
      const x = pad.left + (i + 0.5) * slot - barW / 2;
      const y = pad.top + chartH - h;
      content += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${escapeXml(palette[i % palette.length])}" rx="2"/>`;
      content += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="#6b7280">${escapeXml(String(v))}</text>`;
      content += `<text x="${x + barW / 2}" y="${height - 12}" text-anchor="middle" font-size="11" fill="#374151">${escapeXml(labels[i] ?? "")}</text>`;
    });
    content += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + chartH}" stroke="#e5e7eb"/>`;
    content += `<line x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}" stroke="#e5e7eb"/>`;
  } else if (type === "line") {
    const points = values
      .map((v, i) => {
        const x = pad.left + (i / Math.max(1, values.length - 1)) * chartW;
        const y = pad.top + chartH - (v / max) * chartH;
        return `${x},${y}`;
      })
      .join(" ");
    values.forEach((v, i) => {
      const x = pad.left + (i / Math.max(1, values.length - 1)) * chartW;
      const y = pad.top + chartH - (v / max) * chartH;
      content += `<circle cx="${x}" cy="${y}" r="3" fill="${escapeXml(palette[0])}"/>`;
      content += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="10" fill="#6b7280">${escapeXml(String(v))}</text>`;
      content += `<text x="${x}" y="${height - 12}" text-anchor="middle" font-size="11" fill="#374151">${escapeXml(labels[i] ?? "")}</text>`;
    });
    content += `<polyline points="${points}" fill="none" stroke="${escapeXml(palette[0])}" stroke-width="2"/>`;
    content += `<line x1="${pad.left}" y1="${pad.top + chartH}" x2="${width - pad.right}" y2="${pad.top + chartH}" stroke="#e5e7eb"/>`;
  } else if (type === "pie") {
    let start = 0;
    const cx = width / 2;
    const cy = height / 2;
    values.forEach((v, i) => {
      const angle = (v / total) * 2 * Math.PI;
      const x1 = cx + Math.cos(start) * 80;
      const y1 = cy + Math.sin(start) * 80;
      const x2 = cx + Math.cos(start + angle) * 80;
      const y2 = cy + Math.sin(start + angle) * 80;
      const large = angle > Math.PI ? 1 : 0;
      content += `<path d="M${cx},${cy} L${x1},${y1} A80,80 0 ${large},1 ${x2},${y2} Z" fill="${escapeXml(palette[i % palette.length])}" stroke="#fff" stroke-width="1"/>`;
      const labelAngle = start + angle / 2;
      const lx = cx + Math.cos(labelAngle) * 96;
      const ly = cy + Math.sin(labelAngle) * 96;
      content += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="#374151">${escapeXml(labels[i] ?? "")}</text>`;
      start += angle;
    });
  }

  const titleSvg = title
    ? `<text x="${width / 2}" y="18" text-anchor="middle" font-size="14" font-weight="600" fill="#111827">${escapeXml(title)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width:100%">${titleSvg}${content}</svg>`;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * 图表节点：根据 labels/values 渲染为 SVG 图片（data URL）。
 */
export const Chart = Node.create({
  name: "chart",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      type: { default: "bar" },
      title: { default: "" },
      labels: { default: "" },
      values: { default: "" },
      colors: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-chart]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as {
      type: ChartType;
      title: string;
      labels: string;
      values: string;
      colors: string;
    };
    const labels = parseLabels(attrs.labels);
    const values = parseValues(attrs.values);
    const colors = attrs.colors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const svg = generateChartSvg(attrs.type, attrs.title, labels, values, colors);
    const src = svgToDataUrl(svg);
    return [
      "img",
      {
        "data-chart": "true",
        src,
        alt: attrs.title || "图表",
        style: "display:block;max-width:100%;margin:0 auto;border:1px solid #e5e7eb;border-radius:6px;",
      },
    ];
  },

  addCommands() {
    return {
      insertChart:
        (options) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs: options }).run(),
    };
  },
});
