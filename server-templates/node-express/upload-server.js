// sEditor 图片上传后端模板 — Node.js (Express + multer)
//
// 依赖：
//   pnpm add express multer cors
//   pnpm add -D @types/express @types/multer @types/cors
//
// 环境变量：
//   PORT           监听端口（默认 3000）
//   PUBLIC_BASE    静态资源访问 URL 前缀（默认 http://localhost:3000/uploads）
//   CORS_ORIGIN    允许的来源，逗号分隔（默认 http://localhost:5173）
//   UPLOAD_TOKEN   上传鉴权 token，留空则不鉴权（仅开发用）
//   MAX_SIZE       单文件大小上限，字节（默认 5MB）
//   RATE_LIMIT     每 IP 每分钟上传次数（默认 10）
//
// 运行：node upload-server.js

import express from "express";
import multer from "multer";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { open } from "node:fs/promises";
import crypto from "node:crypto";

const __dirname = import.meta.dirname;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 配置
const MAX_SIZE = Number(process.env.MAX_SIZE) || 5 * 1024 * 1024;
const PUBLIC_BASE = process.env.PUBLIC_BASE || `http://localhost:${PORT}/uploads`;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN || "";
const RATE_LIMIT = Number(process.env.RATE_LIMIT) || 10;

// 仅允许的图片 MIME 类型（不含 SVG，因 SVG 可内嵌脚本导致 XSS）
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
// magic bytes 文件头校验（防伪造扩展名）
const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
};
// MIME → 扩展名映射
const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// —— 文件上传（非图片，作为下载链接插入） ——
// 文件扩展名黑名单：禁止可执行/脚本/HTML 等危险类型
const FILE_EXT_BLACKLIST = new Set([
  ".html", ".htm", ".xhtml", ".svg", ".xml",
  ".js", ".mjs", ".ts", ".jsx", ".tsx",
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi",
  ".php", ".jsp", ".asp", ".aspx",
  ".jar", ".war", ".class",
  ".py", ".rb", ".pl",
  // 不允许直接上传代码/配置
  ".env", ".config", ".ini",
]);
const FILE_MAX_SIZE = Number(process.env.FILE_MAX_SIZE) || 20 * 1024 * 1024; // 20MB

// 鉴权中间件（UPLOAD_TOKEN 为空时跳过，仅用于开发）
function auth(req, res, next) {
  if (!UPLOAD_TOKEN) return next();
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${UPLOAD_TOKEN}`) {
    return res.status(401).json({ error: "未授权" });
  }
  next();
}

// 简单内存速率限制（基于 IP，每分钟 RATE_LIMIT 次）
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = rateMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (bucket.count >= RATE_LIMIT) {
    return res.status(429).json({ error: "请求过于频繁，请稍后再试" });
  }
  bucket.count++;
  next();
}

// 校验文件 magic bytes
async function verifyMagic(filePath, mime) {
  const expected = MAGIC_BYTES[mime];
  if (!expected) return false;
  const buf = Buffer.alloc(expected.length);
  const fh = await open(filePath, "r");
  try {
    await fh.read(buf, 0, expected.length, 0);
  } finally {
    await fh.close();
  }
  return expected.every((b, i) => buf[i] === b);
}

// CORS 白名单
app.use(cors({ origin: CORS_ORIGIN, methods: ["POST", "OPTIONS"] }));

// 静态资源 + 安全响应头
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'");
      res.setHeader("X-Frame-Options", "DENY");
    },
  }),
);

// 临时存储后再做 magic bytes 校验，校验通过才重命名为正确扩展名
const tmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, `tmp_${crypto.randomBytes(16).toString("hex")}`),
});

const upload = multer({
  storage: tmpStorage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("不支持的文件类型，仅支持 jpg/png/gif/webp"));
  },
});

// 文件上传专用 multer：放宽大小到 FILE_MAX_SIZE，不做 MIME 白名单（用扩展名黑名单代替）
const fileUpload = multer({
  storage: tmpStorage,
  limits: { fileSize: FILE_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (FILE_EXT_BLACKLIST.has(ext)) {
      return cb(new Error(`不允许上传 ${ext} 类型的文件`));
    }
    cb(null, true);
  },
});

// 简单结构化日志
function log(level, msg, fields) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  console.log(line);
}

// 上传接口：POST /api/upload
// 请求：multipart/form-data，字段名 file
// 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
// 成功响应：{ url: "https://.../xxx.png" }
// 失败响应：{ error: "错误信息" }
app.post("/api/upload", rateLimit, auth, (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  upload.single("file")(req, res, async (err) => {
    if (err) {
      log("warn", "upload rejected", { ip, reason: err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "未接收到文件" });
    }

    // magic bytes 校验
    const ok = await verifyMagic(req.file.path, req.file.mimetype).catch(() => false);
    if (!ok) {
      fs.unlink(req.file.path, () => {});
      log("warn", "upload rejected", { ip, reason: "magic bytes mismatch" });
      return res.status(400).json({ error: "文件内容与类型不匹配" });
    }

    // 根据真实 MIME 重命名为正确扩展名
    const ext = EXT_BY_MIME[req.file.mimetype] || ".bin";
    const finalName = crypto.randomBytes(16).toString("hex") + ext;
    const finalPath = path.join(UPLOAD_DIR, finalName);

    try {
      fs.renameSync(req.file.path, finalPath);
    } catch (e) {
      log("error", "rename failed", { ip, err: String(e) });
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: "服务器内部错误，请稍后重试" });
    }

    const url = `${PUBLIC_BASE}/${finalName}`;
    log("info", "upload ok", { ip, file: finalName, size: req.file.size });
    res.json({ url });
  });
});

// 文件上传接口：POST /api/upload-file
// 用于 sEditor 的「文件」功能（插入下载链接，非图片）
// 请求：multipart/form-data，字段名 file
// 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
// 成功响应：{ url: "https://.../xxx.pdf", name: "原始文件名.pdf" }
// 失败响应：{ error: "错误信息" }
app.post("/api/upload-file", rateLimit, auth, (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  fileUpload.single("file")(req, res, (err) => {
    if (err) {
      log("warn", "upload-file rejected", { ip, reason: err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "未接收到文件" });
    }

    const originalName = req.file.originalname || "file";
    const ext = path.extname(originalName).toLowerCase();

    // 重命名为随机文件名（保留原扩展名）
    const finalName = crypto.randomBytes(16).toString("hex") + ext;
    const finalPath = path.join(UPLOAD_DIR, finalName);

    try {
      fs.renameSync(req.file.path, finalPath);
    } catch (e) {
      log("error", "rename failed", { ip, err: String(e) });
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: "服务器内部错误，请稍后重试" });
    }

    const url = `${PUBLIC_BASE}/${finalName}`;
    log("info", "upload-file ok", {
      ip,
      file: finalName,
      originalName,
      size: req.file.size,
    });
    res.json({ url, name: originalName });
  });
});

// 全局错误处理
app.use((err, _req, res, _next) => {
  log("error", "unhandled", { err: err.message });
  res.status(500).json({ error: "服务器内部错误，请稍后重试" });
});

const server = app.listen(PORT, () => {
  log("info", "server started", { port: PORT, dir: UPLOAD_DIR });
});

// Graceful shutdown
function shutdown(sig) {
  log("info", "shutdown", { sig });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
