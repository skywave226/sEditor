# sEditor 图片上传后端模板 — Python (Flask)
#
# 依赖：
#   pip install flask flask-cors
#
# 环境变量：
#   HOST           监听地址（默认 127.0.0.1，生产建议反向代理后保留 127.0.0.1）
#   PORT           监听端口（默认 5000）
#   PUBLIC_BASE    静态资源访问 URL 前缀（默认 http://localhost:5000/uploads）
#   CORS_ORIGIN    允许的来源，逗号分隔（默认 http://localhost:5173）
#   UPLOAD_TOKEN   上传鉴权 token，留空则不鉴权（仅开发用）
#   MAX_SIZE       单文件大小上限，字节（默认 5MB）
#   RATE_LIMIT     每 IP 每分钟上传次数（默认 10）
#   FLASK_DEBUG    调试模式（默认 0，生产必须为 0）
#   FILE_MAX_SIZE  通用文件大小上限，字节（默认 20MB，用于 /api/upload-file）

import os
import uuid
import logging
import time
from collections import defaultdict
from threading import Lock
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)

# 配置
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_SIZE = int(os.environ.get("MAX_SIZE", 5 * 1024 * 1024))
FILE_MAX_SIZE = int(os.environ.get("FILE_MAX_SIZE", 20 * 1024 * 1024))
PUBLIC_BASE = os.environ.get("PUBLIC_BASE", "http://localhost:5000/uploads")
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173").split(",")
UPLOAD_TOKEN = os.environ.get("UPLOAD_TOKEN", "")
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", 10))

# 仅允许的扩展名（不含 SVG，因 SVG 可内嵌脚本导致 XSS）
ALLOWED_EXT = {"jpg", "jpeg", "png", "gif", "webp"}
# magic bytes 文件头校验
MAGIC_BYTES = {
    "jpg": b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "png": b"\x89PNG\r\n\x1a\n",
    "gif": b"GIF8",
    "webp": b"RIFF",
}

# 通用文件上传扩展名黑名单：禁止可执行/脚本/HTML 等危险类型
FILE_EXT_BLACKLIST = {
    ".html", ".htm", ".xhtml", ".svg", ".xml",
    ".js", ".mjs", ".ts", ".jsx", ".tsx",
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi",
    ".php", ".jsp", ".asp", ".aspx",
    ".jar", ".war", ".class",
    ".py", ".rb", ".pl",
    ".env", ".config", ".ini",
}

# CORS 白名单
CORS(app, origins=CORS_ORIGIN, methods=["POST", "OPTIONS"])

# 结构化日志
logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}',
)
log = logging.getLogger("seditor-upload")


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def verify_magic(filepath: str, ext: str) -> bool:
    expected = MAGIC_BYTES.get(ext)
    if not expected:
        return False
    try:
        with open(filepath, "rb") as f:
            head = f.read(len(expected))
        return head.startswith(expected)
    except OSError:
        return False


# 简单内存速率限制（基于 IP，每分钟 RATE_LIMIT 次）
rate_map: dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": 0})
rate_lock = Lock()


def rate_limit():
    ip = request.remote_addr or "unknown"
    now = time.time()
    with rate_lock:
        bucket = rate_map[ip]
        if now > bucket["reset_at"]:
            bucket["count"] = 1
            bucket["reset_at"] = now + 60
        else:
            bucket["count"] += 1
        if bucket["count"] > RATE_LIMIT:
            return False
    return True


def auth_check():
    if not UPLOAD_TOKEN:
        return True
    auth = request.headers.get("Authorization", "")
    return auth == f"Bearer {UPLOAD_TOKEN}"


@app.before_request
def pre_check():
    # 早期拒绝超大请求（避免 read() 时 OOM）
    cl = request.content_length
    # /api/upload-file 允许更大的体积
    limit = FILE_MAX_SIZE if request.path == "/api/upload-file" else MAX_SIZE
    if cl and cl > limit + 1024:  # 留 1KB 给 multipart 头
        return jsonify({"error": "文件过大"}), 413


# 上传接口：POST /api/upload
# 请求：multipart/form-data，字段名 file
# 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
# 成功响应：{ "url": "https://.../xxx.png" }
# 失败响应：{ "error": "错误信息" }
@app.route("/api/upload", methods=["POST"])
def upload():
    ip = request.remote_addr or "unknown"

    if not rate_limit():
        log.warning(f"upload rate-limited ip={ip}")
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429

    if not auth_check():
        log.warning(f"upload unauthorized ip={ip}")
        return jsonify({"error": "未授权"}), 401

    if "file" not in request.files:
        return jsonify({"error": "未接收到文件"}), 400

    f = request.files["file"]
    if not f or f.filename == "":
        return jsonify({"error": "未选择文件"}), 400

    # secure_filename 仅用于日志展示，实际文件名用 UUID
    safe_name = secure_filename(f.filename or "")
    if not allowed_file(safe_name):
        return jsonify({"error": "不支持的文件类型，仅支持 jpg/png/gif/webp"}), 400

    ext = safe_name.rsplit(".", 1)[1].lower()
    tmp_name = f"tmp_{uuid.uuid4().hex}"
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)

    # 流式保存到临时文件
    try:
        f.save(tmp_path)
    except OSError as e:
        log.error(f"save failed ip={ip} err={e}")
        return jsonify({"error": "服务器内部错误，请稍后重试"}), 500

    # 流式保存后再校验大小（防止伪造 Content-Length）
    try:
        size = os.path.getsize(tmp_path)
    except OSError:
        size = 0
    if size > MAX_SIZE:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        log.warning(f"upload too large ip={ip} size={size}")
        return jsonify({"error": f"文件过大，最大支持 {MAX_SIZE // 1024 // 1024}MB"}), 400

    # magic bytes 校验
    if not verify_magic(tmp_path, ext):
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        log.warning(f"magic mismatch ip={ip} name={safe_name}")
        return jsonify({"error": "文件内容与类型不匹配"}), 400

    final_name = f"{uuid.uuid4().hex}.{ext}"
    final_path = os.path.join(UPLOAD_DIR, final_name)
    try:
        os.rename(tmp_path, final_path)
    except OSError as e:
        log.error(f"rename failed ip={ip} err={e}")
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return jsonify({"error": "服务器内部错误，请稍后重试"}), 500

    url = f"{PUBLIC_BASE}/{final_name}"
    log.info(f"upload ok ip={ip} file={final_name} size={size}")
    return jsonify({"url": url})


# 文件上传接口：POST /api/upload-file
# 用于 sEditor 的「文件」功能（插入下载链接，非图片）
# 请求：multipart/form-data，字段名 file
# 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
# 成功响应：{ "url": "https://.../xxx.pdf", "name": "原始文件名.pdf" }
# 失败响应：{ "error": "错误信息" }
@app.route("/api/upload-file", methods=["POST"])
def upload_file():
    ip = request.remote_addr or "unknown"

    if not rate_limit():
        log.warning(f"upload-file rate-limited ip={ip}")
        return jsonify({"error": "请求过于频繁，请稍后再试"}), 429

    if not auth_check():
        log.warning(f"upload-file unauthorized ip={ip}")
        return jsonify({"error": "未授权"}), 401

    if "file" not in request.files:
        return jsonify({"error": "未接收到文件"}), 400

    f = request.files["file"]
    if not f or f.filename == "":
        return jsonify({"error": "未选择文件"}), 400

    original_name = secure_filename(f.filename) or "file"
    ext = os.path.splitext(original_name)[1].lower()
    if not ext:
        return jsonify({"error": "文件名缺少扩展名"}), 400
    if ext in FILE_EXT_BLACKLIST:
        log.warning(f"upload-file rejected ip={ip} ext={ext}")
        return jsonify({"error": f"不允许上传 {ext} 类型的文件"}), 400

    tmp_name = f"tmp_{uuid.uuid4().hex}"
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)
    try:
        f.save(tmp_path)
    except OSError as e:
        log.error(f"save failed ip={ip} err={e}")
        return jsonify({"error": "服务器内部错误，请稍后重试"}), 500

    try:
        size = os.path.getsize(tmp_path)
    except OSError:
        size = 0
    if size > FILE_MAX_SIZE:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        log.warning(f"upload-file too large ip={ip} size={size}")
        return jsonify({"error": f"文件过大，最大支持 {FILE_MAX_SIZE // 1024 // 1024}MB"}), 400

    final_name = f"{uuid.uuid4().hex}{ext}"
    final_path = os.path.join(UPLOAD_DIR, final_name)
    try:
        os.rename(tmp_path, final_path)
    except OSError as e:
        log.error(f"rename failed ip={ip} err={e}")
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        return jsonify({"error": "服务器内部错误，请稍后重试"}), 500

    url = f"{PUBLIC_BASE}/{final_name}"
    log.info(f"upload-file ok ip={ip} file={final_name} original={original_name} size={size}")
    return jsonify({"url": url, "name": f.filename})


@app.route("/uploads/<filename>")
def serve_upload(filename):
    # 防路径遍历
    if "/" in filename or "\\" in filename or ".." in filename:
        abort(404)
    resp = send_from_directory(UPLOAD_DIR, filename)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Content-Security-Policy"] = "default-src 'none'"
    return resp


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    if debug:
        log.warning("FLASK_DEBUG=1 已开启，仅可用于本地开发，生产环境必须关闭")
    app.run(host=host, port=port, debug=debug)
