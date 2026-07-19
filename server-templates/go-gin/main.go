// sEditor 图片上传后端模板 — Go (Gin)
//
// 依赖：
//   go get -u github.com/gin-gonic/gin
//   go get -u github.com/google/uuid
//
// 运行：go run main.go
// 接口：POST /api/upload
// 成功响应：{ "url": "https://.../xxx.png" }
// 失败响应：{ "error": "错误信息" }

package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	maxSize   = 5 * 1024 * 1024 // 5MB
	uploadDir = "./uploads"
)

var allowedExt = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".svg":  true,
}

func main() {
	// 确保上传目录存在
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		panic(err)
	}

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// 静态资源
	r.Static("/uploads", uploadDir)

	// 上传接口
	r.POST("/api/upload", handleUpload)

	fmt.Println("[sEditor upload server] running at http://localhost:8080")
	r.Run(":8080")
}

func handleUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未接收到文件"})
		return
	}

	// 大小检查
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("文件过大，最大支持 %dMB", maxSize/1024/1024),
		})
		return
	}

	// 扩展名检查
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "不支持的文件类型，仅支持 jpg/png/gif/webp/svg",
		})
		return
	}

	// 生成随机文件名
	filename := uuid.New().String() + ext
	dest := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "文件保存失败：" + err.Error(),
		})
		return
	}

	// PUBLIC_BASE 环境变量可配置外部访问域名
	publicBase := os.Getenv("PUBLIC_BASE")
	if publicBase == "" {
		publicBase = "http://localhost:8080/uploads"
	}
	url := publicBase + "/" + filename

	c.JSON(http.StatusOK, gin.H{"url": url})
}
