// sEditor 图片上传后端模板 — Node.js (Express + multer)
// 依赖：express、multer、cors
//   pnpm add express multer cors
//   pnpm add -D @types/express @types/multer @types/cors

import express from "express";
import multer from "multer";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 上传目录（请确保可写）
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 允许的图片 MIME 类型
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
// 单文件大小上限（5MB）
const MAX_SIZE = 5 * 1024 * 1024;
// 访问静态资源的 URL 前缀
const PUBLIC_BASE = process.env.PUBLIC_BASE || `http://localhost:${PORT}/uploads`;

app.use(cors());
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("不支持的文件类型，仅支持 jpg/png/gif/webp/svg"));
  },
});

// 上传接口：POST /api/upload
// 请求：multipart/form-data，字段名 file
// 成功响应：{ url: "https://.../xxx.png" }
// 失败响应：{ error: "错误信息" }
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "未接收到文件" });
    }
    const url = `${PUBLIC_BASE}/${req.file.filename}`;
    res.json({ url });
  });
});

app.listen(PORT, () => {
  console.log(`[sEditor upload server] running at http://localhost:${PORT}`);
  console.log(`[sEditor upload server] upload dir: ${UPLOAD_DIR}`);
});
