# sEditor 图片上传后端模板 — Python (Flask)
# 依赖：Flask
#   pip install flask flask-cors

import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 上传目录（请确保可写）
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 允许的图片扩展名
ALLOWED_EXT = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
# 单文件大小上限（5MB）
MAX_SIZE = 5 * 1024 * 1024
# 访问静态资源的 URL 前缀
PUBLIC_BASE = os.environ.get("PUBLIC_BASE", "http://localhost:5000/uploads")


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


# 上传接口：POST /api/upload
# 请求：multipart/form-data，字段名 file
# 成功响应：{ "url": "https://.../xxx.png" }
# 失败响应：{ "error": "错误信息" }
@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "未接收到文件"}), 400

    f = request.files["file"]
    if not f or f.filename == "":
        return jsonify({"error": "未选择文件"}), 400

    if not allowed_file(f.filename):
        return jsonify({"error": "不支持的文件类型，仅支持 jpg/png/gif/webp/svg"}), 400

    # 读取文件大小（先读到内存，大文件请改为流式写入）
    data = f.read()
    if len(data) > MAX_SIZE:
        return jsonify({"error": f"文件过大，最大支持 {MAX_SIZE // 1024 // 1024}MB"}), 400

    ext = f.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as out:
        out.write(data)

    url = f"{PUBLIC_BASE}/{filename}"
    return jsonify({"url": url})


@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
