# sEditor 图片上传后端模板

为 sEditor 富文本编辑器提供图片上传接口的 5 种常见后端语言模板，统一接口契约、统一安全策略。

## 接口契约

所有模板实现统一接口：

| 项 | 说明 |
| --- | --- |
| 路径 | `POST /api/upload`（PHP 为 `/api/upload.php`） |
| Content-Type | `multipart/form-data` |
| 表单字段 | `file`（图片文件） |
| 鉴权 | `Authorization: Bearer <UPLOAD_TOKEN>`（配置 `UPLOAD_TOKEN` 时启用） |
| 成功响应 | `200 { "url": "https://your-domain/uploads/xxx.png" }` |
| 失败响应 | `4xx/5xx { "error": "错误描述" }` |

## 模板清单

| 语言 / 框架 | 路径 | 依赖 | 默认端口 |
| --- | --- | --- | --- |
| Node.js (Express) | `node-express/upload-server.js` | express、multer、cors | 3000 |
| Python (Flask) | `python-flask/app.py` | flask、flask-cors | 5000 |
| Java (Spring Boot) | `java-springboot/UploadController.java` + `application.yml` | spring-boot-starter-web | 8080 |
| PHP（原生） | `php/upload.php` + `php/uploads/.htaccess` | 零依赖 | 任意 |
| Go (Gin) | `go-gin/main.go` | gin、google/uuid | 8080 |

## 环境变量

所有模板支持以下环境变量（PHP 用 `getenv()`，Java 用 `application.yml` 的 `${VAR:default}`）：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `HOST` | 监听地址 | Node/Go: `0.0.0.0`；Python/Java: `127.0.0.1` |
| `PORT` | 监听端口 | 各语言默认 |
| `UPLOAD_DIR` | 上传目录（仅 Go 显式支持，其他用相对路径） | `./uploads` |
| `PUBLIC_BASE` | 静态资源 URL 前缀 | `http://localhost:<PORT>/uploads` |
| `CORS_ORIGIN` | 允许的来源，逗号分隔 | `http://localhost:5173` |
| `UPLOAD_TOKEN` | 鉴权 token，留空则不鉴权 | 空 |
| `MAX_SIZE` | 单文件大小上限（字节） | `5242880`（5MB） |
| `RATE_LIMIT` | 每 IP 每分钟上传次数 | `10` |
| `FLASK_DEBUG` | Flask 调试模式（仅 Python） | `0` |

## 安全特性（所有模板统一实现）

| 特性 | 说明 |
| --- | --- |
| **类型白名单** | 仅允许 jpg/jpeg/png/gif/webp（**SVG 已禁用**，因可内嵌脚本导致 XSS） |
| **Magic Bytes 校验** | 读取文件头字节判断真实类型，防伪造扩展名 |
| **文件大小限制** | multer/Flask/Spring/move_uploaded_file/gin 均配置上限 |
| **随机文件名** | UUID/cryptographically random，防路径遍历与覆盖 |
| **CORS 白名单** | 通过 `CORS_ORIGIN` 配置允许的来源，不再使用 `*` |
| **Bearer Token 鉴权** | 配置 `UPLOAD_TOKEN` 后启用，常量时间比较防时序攻击 |
| **速率限制** | 基于 IP 的内存计数器，默认 10 次/分钟 |
| **安全响应头** | `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `Content-Security-Policy: default-src 'none'` |
| **结构化日志** | JSON 格式，记录 IP/文件名/大小/状态 |
| **错误信息脱敏** | 详细错误仅入日志，响应给客户端的是模糊信息 |
| **文件权限** | 显式设置 `0640`（仅 owner 读写） |
| **临时文件策略** | 先存为 `tmp_*` 临时文件，校验通过后再原子重命名为最终文件名 |
| **PHP 防解析** | `uploads/.htaccess` 禁止 PHP 解析与脚本执行 |
| **Graceful Shutdown** | Node.js 处理 SIGTERM/SIGINT |

## 部署 Checklist

### 上线前必做

- [ ] **设置 `UPLOAD_TOKEN`**：使用强随机字符串（至少 32 字节），通过环境变量注入
- [ ] **配置 `CORS_ORIGIN`**：仅允许你的前端域名
- [ ] **配置 `PUBLIC_BASE`**：使用 HTTPS 的对外可访问域名
- [ ] **设置反向代理**：Nginx/Caddy 在前，终止 TLS、限制请求体大小、转发 `X-Forwarded-For`
- [ ] **关闭调试模式**：Python `FLASK_DEBUG=0`，Java 不要开 `--debug`
- [ ] **限制监听地址**：仅监听 `127.0.0.1`，通过反向代理对外
- [ ] **设置 `client_max_body_size`**：Nginx 配置 `client_max_body_size 6m;`
- [ ] **独立运行账户**：不要用 root 跑服务，建议建专用账户
- [ ] **上传目录权限**：`0750` 目录 + `0640` 文件，禁止执行
- [ ] **静态资源响应头**：Nginx 加 `add_header X-Content-Type-Options nosniff;`

### 上线后建议

- [ ] **接入对象存储**：生产建议把图片传到 OSS/COS/S3，而非本地磁盘
- [ ] **加文件清理 cron**：定期清理超过 N 天未访问的文件（若是临时图床）
- [ ] **接入监控**：Prometheus 指标 + 告警（上传成功率、QPS、磁盘占用）
- [ ] **接入 WAF**：Cloudflare 等 WAF 拦截恶意请求
- [ ] **日志归档**：日志按天切割，保留 30-90 天
- [ ] **CDN 加速**：图片资源走 CDN
- [ ] **限流上 Redis**：单机内存限流在多实例部署下不生效，改用 Redis 共享计数

## 前端接入示例

以 Node.js 后端为例：

```js
const editor = sEditor.create({
  target: '#editor',
  imageMaxSize: 5 * 1024 * 1024,
  imageUpload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('https://api.your-domain.com/api/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + UPLOAD_TOKEN },
      body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.error || '上传失败');
    }
    return json.url;
  },
});
```

## Nginx 反向代理参考

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /etc/ssl/your-domain.crt;
    ssl_certificate_key /etc/ssl/your-domain.key;

    # 限制请求体大小
    client_max_body_size 6m;

    # 上传接口转发
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源（建议直接由 Nginx 托管，不经过应用）
    location /uploads/ {
        alias /var/www/seditor/uploads/;
        # 禁止执行脚本
        location ~ \.php$ { return 403; }
        # 安全响应头
        add_header X-Content-Type-Options nosniff;
        add_header Content-Security-Policy "default-src 'none'";
        add_header X-Frame-Options DENY;
        # 长缓存
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

## 已知限制

1. **内存速率限制**：多实例部署时无效，需替换为 Redis
2. **本地磁盘存储**：单机部署，不支持水平扩展；生产建议接 OSS/S3
3. **无文件清理**：磁盘会持续增长，需配合 cron
4. **无图片处理**：不做缩放/压缩/水印，需要可接 sharp/ImageMagick
5. **Bearer Token 是静态的**：建议替换为短期 JWT 或 OAuth2
