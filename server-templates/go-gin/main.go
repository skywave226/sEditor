// sEditor 图片上传后端模板 — Go (Gin)
//
// 依赖：
//   go get -u github.com/gin-gonic/gin
//   go get -u github.com/google/uuid
//
// 环境变量：
//   HOST           监听地址（默认 127.0.0.1，生产建议反向代理后保留 127.0.0.1）
//   PORT           监听端口（默认 8080）
//   UPLOAD_DIR     上传目录（默认 ./uploads）
//   PUBLIC_BASE    静态资源访问 URL 前缀（默认 http://localhost:8080/uploads）
//   CORS_ORIGIN    允许的来源，逗号分隔（默认 http://localhost:5173）
//   UPLOAD_TOKEN   上传鉴权 token，留空则不鉴权（仅开发用）
//   MAX_SIZE       单文件大小上限，字节（默认 5MB）
//   FILE_MAX_SIZE  通用文件大小上限，字节（默认 20MB，用于 /api/upload-file）
//   RATE_LIMIT     每 IP 每分钟上传次数（默认 10）
//
// 接口：POST /api/upload（图片）、POST /api/upload-file（通用文件）
// 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
// 成功响应：{ "url": "https://.../xxx.png" } 或 { "url": "...", "name": "原始文件名.pdf" }
// 失败响应：{ "error": "错误信息" }

package main

import (
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// 配置
var (
	maxSize      int64
	fileMaxSize  int64
	uploadDir    string
	publicBase   string
	corsOrigins  []string
	uploadToken  string
	rateLimitNum int
)

const (
	defaultMaxSize     = 5 * 1024 * 1024  // 5MB
	defaultFileMaxSize = 20 * 1024 * 1024 // 20MB
	defaultRateLimit   = 10
)

// 仅允许的扩展名（不含 SVG，因 SVG 可内嵌脚本导致 XSS）
var allowedExt = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

// magic bytes 文件头校验
var magicBytes = map[string][]byte{
	".jpg":  {0xFF, 0xD8, 0xFF},
	".jpeg": {0xFF, 0xD8, 0xFF},
	".png":  {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
	".gif":  {0x47, 0x49, 0x46, 0x38},
	".webp": {0x52, 0x49, 0x46, 0x46}, // RIFF
}

// 扩展名 → 最终存储扩展名
var extByType = map[string]string{
	".jpg":  ".jpg",
	".jpeg": ".jpg",
	".png":  ".png",
	".gif":  ".gif",
	".webp": ".webp",
}

// 通用文件上传扩展名黑名单：禁止可执行/脚本/HTML 等危险类型
var fileExtBlacklist = map[string]bool{
	".html": true, ".htm": true, ".xhtml": true, ".svg": true, ".xml": true,
	".js": true, ".mjs": true, ".ts": true, ".jsx": true, ".tsx": true,
	".exe": true, ".bat": true, ".cmd": true, ".sh": true, ".ps1": true, ".msi": true,
	".php": true, ".jsp": true, ".asp": true, ".aspx": true,
	".jar": true, ".war": true, ".class": true,
	".py": true, ".rb": true, ".pl": true,
	".env": true, ".config": true, ".ini": true,
}

// 速率限制桶
type rateBucket struct {
	count   int
	resetAt time.Time
}

var (
	rateMap     = make(map[string]*rateBucket)
	rateMapLock sync.Mutex
)

func loadConfig() {
	maxSize = defaultMaxSize
	if v := os.Getenv("MAX_SIZE"); v != "" {
		var n int64
		fmt.Sscanf(v, "%d", &n)
		if n > 0 {
			maxSize = n
		}
	}
	fileMaxSize = defaultFileMaxSize
	if v := os.Getenv("FILE_MAX_SIZE"); v != "" {
		var n int64
		fmt.Sscanf(v, "%d", &n)
		if n > 0 {
			fileMaxSize = n
		}
	}
	uploadDir = os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	publicBase = os.Getenv("PUBLIC_BASE")
	if publicBase == "" {
		host := os.Getenv("HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		publicBase = fmt.Sprintf("http://%s:%s/uploads", host, port)
	}
	corsOrigins = strings.Split(os.Getenv("CORS_ORIGIN"), ",")
	if len(corsOrigins) == 1 && corsOrigins[0] == "" {
		corsOrigins = []string{"http://localhost:5173"}
	}
	uploadToken = os.Getenv("UPLOAD_TOKEN")
	rateLimitNum = defaultRateLimit
	if v := os.Getenv("RATE_LIMIT"); v != "" {
		var n int
		fmt.Sscanf(v, "%d", &n)
		if n > 0 {
			rateLimitNum = n
		}
	}
}

func main() {
	loadConfig()

	// 确保上传目录存在
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		log.Fatalf("[seditor-upload] 无法创建上传目录: %v", err)
	}

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// CORS 中间件
	r.Use(corsMiddleware())

	// 静态资源 + 安全响应头
	r.Static("/uploads", uploadDir)
	// 注：gin.Static 不支持自定义响应头，生产建议用 nginx 托管静态资源
	// 并显式添加 X-Content-Type-Options: nosniff / CSP

	// 上传接口
	r.POST("/api/upload", rateLimitMiddleware(), authMiddleware(), handleUpload)
	r.POST("/api/upload-file", rateLimitMiddleware(), authMiddleware(), handleFileUpload)

	host := os.Getenv("HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("[seditor-upload] running at http://%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("[seditor-upload] server error: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		for _, o := range corsOrigins {
			if o == origin {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				c.Writer.Header().Set("Vary", "Origin")
				break
			}
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := clientIP(c)
		rateMapLock.Lock()
		bucket, ok := rateMap[ip]
		now := time.Now()
		if !ok || now.After(bucket.resetAt) {
			rateMap[ip] = &rateBucket{count: 1, resetAt: now.Add(time.Minute)}
			rateMapLock.Unlock()
			c.Next()
			return
		}
		bucket.count++
		if bucket.count > rateLimitNum {
			rateMapLock.Unlock()
			log.Printf("[seditor-upload] rate-limited ip=%s", ip)
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "请求过于频繁，请稍后再试"})
			c.Abort()
			return
		}
		rateMapLock.Unlock()
		c.Next()
	}
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if uploadToken == "" {
			c.Next()
			return
		}
		auth := c.Request.Header.Get("Authorization")
		expected := "Bearer " + uploadToken
		if subtle.ConstantTimeCompare([]byte(auth), []byte(expected)) != 1 {
			log.Printf("[seditor-upload] unauthorized ip=%s", clientIP(c))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func handleUpload(c *gin.Context) {
	ip := clientIP(c)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未接收到文件"})
		return
	}

	// 大小检查
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("文件过大，最大支持 %.1fMB", float64(maxSize)/1024.0/1024.0),
		})
		return
	}

	// 扩展名检查
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "不支持的文件类型，仅支持 jpg/png/gif/webp",
		})
		return
	}

	// 临时存储后再做 magic bytes 校验
	tmpName := "tmp_" + hex.EncodeToString(uuid.New()[:]) + ext
	tmpPath := filepath.Join(uploadDir, tmpName)
	if err := c.SaveUploadedFile(file, tmpPath); err != nil {
		log.Printf("[seditor-upload] save failed ip=%s err=%v", ip, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误，请稍后重试"})
		return
	}

	// magic bytes 校验
	if !verifyMagic(tmpPath, ext) {
		_ = os.Remove(tmpPath)
		log.Printf("[seditor-upload] magic mismatch ip=%s name=%s", ip, file.Filename)
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件内容与类型不匹配"})
		return
	}

	// 重命名为最终文件名
	finalName := hex.EncodeToString(uuid.New()[:]) + extByType[ext]
	finalPath := filepath.Join(uploadDir, finalName)
	if err := os.Rename(tmpPath, finalPath); err != nil {
		log.Printf("[seditor-upload] rename failed ip=%s err=%v", ip, err)
		_ = os.Remove(tmpPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误，请稍后重试"})
		return
	}

	// 显式设置权限 0640
	_ = os.Chmod(finalPath, 0o640)

	url := publicBase + "/" + finalName
	log.Printf("[seditor-upload] upload ok ip=%s file=%s size=%d", ip, finalName, file.Size)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// 通用文件上传：用于 sEditor 的「文件」功能（插入下载链接，非图片）
// 成功响应：{ "url": "...", "name": "原始文件名.pdf" }
func handleFileUpload(c *gin.Context) {
	ip := clientIP(c)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未接收到文件"})
		return
	}

	// 大小检查
	if file.Size > fileMaxSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("文件过大，最大支持 %.1fMB", float64(fileMaxSize)/1024.0/1024.0),
		})
		return
	}

	// 扩展名黑名单校验
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件名缺少扩展名"})
		return
	}
	if fileExtBlacklist[ext] {
		log.Printf("[seditor-upload] upload-file rejected ip=%s ext=%s", ip, ext)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("不允许上传 %s 类型的文件", ext)})
		return
	}

	// 随机文件名（保留原扩展名）
	finalName := hex.EncodeToString(uuid.New()[:]) + ext
	finalPath := filepath.Join(uploadDir, finalName)
	if err := c.SaveUploadedFile(file, finalPath); err != nil {
		log.Printf("[seditor-upload] save failed ip=%s err=%v", ip, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误，请稍后重试"})
		return
	}

	// 显式设置权限 0640
	_ = os.Chmod(finalPath, 0o640)

	url := publicBase + "/" + finalName
	log.Printf("[seditor-upload] upload-file ok ip=%s file=%s original=%s size=%d", ip, finalName, file.Filename, file.Size)
	c.JSON(http.StatusOK, gin.H{"url": url, "name": file.Filename})
}

func verifyMagic(path, ext string) bool {
	expected, ok := magicBytes[ext]
	if !ok || len(expected) == 0 {
		return false
	}
	f, err := os.Open(path)
	if err != nil {
		return false
	}
	defer f.Close()
	buf := make([]byte, len(expected))
	n, err := f.Read(buf)
	if err != nil || n < len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare(buf, expected) == 1
}

func clientIP(c *gin.Context) string {
	if xff := c.Request.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	return c.ClientIP()
}
