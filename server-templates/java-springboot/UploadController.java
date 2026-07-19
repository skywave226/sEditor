// sEditor 图片上传后端模板 — Java (Spring Boot)
//
// 项目结构：
// src/main/java/com/example/upload/UploadApplication.java
// src/main/java/com/example/upload/UploadController.java
// src/main/resources/application.yml
//
// 依赖（pom.xml）：spring-boot-starter-web
//
// 启动后访问：http://localhost:8080/api/upload（图片）、http://localhost:8080/api/upload-file（通用文件）
//
// 成功响应：{ "url": "https://.../xxx.png" } 或 { "url": "...", "name": "原始文件名.pdf" }
// 失败响应：{ "error": "错误信息" }
//
// 配置见 application.yml，所有项目均可通过环境变量覆盖。

package com.example.upload;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@SpringBootApplication
public class UploadApplication {
    public static void main(String[] args) {
        SpringApplication.run(UploadApplication.class, args);
    }
}

/**
 * 安全响应头过滤器：所有响应强制加 nosniff / CSP / frame-options
 */
@Configuration
class SecurityHeadersFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse resp = (HttpServletResponse) res;
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("X-Frame-Options", "DENY");
        chain.doFilter(req, res);
    }
}

@Configuration
class WebConfig implements WebMvcConfigurer {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.cors-origins:http://localhost:5173}")
    private String corsOrigins;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + new File(uploadDir).getAbsolutePath() + "/")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(corsOrigins.split(","))
                .allowedMethods("POST", "OPTIONS");
    }

    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilterReg() {
        FilterRegistrationBean<SecurityHeadersFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new SecurityHeadersFilter());
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}

/**
 * 简单内存速率限制（每 IP 每分钟 N 次）
 */
@Configuration
class RateLimitConfig {
    @Value("${upload.rate-limit:10}")
    private int rateLimit;

    public static final Map<String, RateBucket> BUCKETS = new ConcurrentHashMap<>();

    public static class RateBucket {
        public AtomicInteger count = new AtomicInteger(0);
        public volatile long resetAt = 0;
    }

    public boolean allow(String ip) {
        long now = System.currentTimeMillis();
        RateBucket bucket = BUCKETS.computeIfAbsent(ip, k -> new RateBucket());
        synchronized (bucket) {
            if (now > bucket.resetAt) {
                bucket.count.set(1);
                bucket.resetAt = now + 60_000;
                return true;
            }
            return bucket.count.incrementAndGet() <= rateLimit;
        }
    }
}

@RestController
@RequestMapping("/api")
class UploadController {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.max-size:5242880}")
    private long maxSize;

    @Value("${upload.file-max-size:20971520}")
    private long fileMaxSize;

    @Value("${upload.public-base:http://localhost:8080/uploads}")
    private String publicBase;

    @Value("${upload.token:}")
    private String uploadToken;

    private final RateLimitConfig rateLimitConfig;

    // 仅允许的扩展名（不含 SVG，因 SVG 可内嵌脚本导致 XSS）
    private static final Set<String> ALLOWED_EXT = Set.of(
            "jpg", "jpeg", "png", "gif", "webp"
    );
    // magic bytes 文件头校验
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
            "gif", new byte[]{0x47, 0x49, 0x46, 0x38},
            "webp", new byte[]{0x52, 0x49, 0x46, 0x46}
    );
    private static final Map<String, String> EXT_BY_TYPE = Map.of(
            "jpg", ".jpg", "jpeg", ".jpg", "png", ".png", "gif", ".gif", "webp", ".webp"
    );
    // 通用文件上传扩展名黑名单：禁止可执行/脚本/HTML 等危险类型
    private static final Set<String> FILE_EXT_BLACKLIST = Set.of(
            ".html", ".htm", ".xhtml", ".svg", ".xml",
            ".js", ".mjs", ".ts", ".jsx", ".tsx",
            ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi",
            ".php", ".jsp", ".asp", ".aspx",
            ".jar", ".war", ".class",
            ".py", ".rb", ".pl",
            ".env", ".config", ".ini"
    );

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger("seditor-upload");

    public UploadController(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file,
                                                       HttpServletRequest req) {
        Map<String, String> resp = new HashMap<>();
        String ip = clientIp(req);

        // 速率限制
        if (!rateLimitConfig.allow(ip)) {
            log.warn("upload rate-limited ip={}", ip);
            resp.put("error", "请求过于频繁，请稍后再试");
            return ResponseEntity.status(429).body(resp);
        }

        // 鉴权
        if (!uploadToken.isEmpty()) {
            String auth = req.getHeader("Authorization");
            if (!("Bearer " + uploadToken).equals(auth)) {
                log.warn("upload unauthorized ip={}", ip);
                resp.put("error", "未授权");
                return ResponseEntity.status(401).body(resp);
            }
        }

        if (file.isEmpty()) {
            resp.put("error", "未接收到文件");
            return ResponseEntity.badRequest().body(resp);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            resp.put("error", "文件名无效");
            return ResponseEntity.badRequest().body(resp);
        }

        String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            resp.put("error", "不支持的文件类型，仅支持 jpg/png/gif/webp");
            return ResponseEntity.badRequest().body(resp);
        }

        if (file.getSize() > maxSize) {
            resp.put("error", String.format("文件过大，最大支持 %.1fMB", maxSize / 1024.0 / 1024.0));
            return ResponseEntity.badRequest().body(resp);
        }

        // 校验上传目录
        File dir = new File(uploadDir);
        try {
            if (!dir.exists() && !dir.mkdirs()) {
                throw new IOException("无法创建上传目录: " + uploadDir);
            }
            if (!dir.isDirectory()) {
                throw new IOException("上传路径不是目录: " + uploadDir);
            }
        } catch (IOException e) {
            log.error("upload dir invalid ip={} err={}", ip, e.getMessage());
            resp.put("error", "服务器内部错误，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }

        // 临时文件名
        String tmpName = "tmp_" + UUID.randomUUID().toString().replace("-", "");
        Path tmpPath = Paths.get(uploadDir, tmpName);

        // 流式写入临时文件 + try-with-resources
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, tmpPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("save failed ip={} err={}", ip, e.getMessage());
            resp.put("error", "服务器内部错误，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }

        // magic bytes 校验
        if (!verifyMagic(tmpPath, ext)) {
            safeDelete(tmpPath);
            log.warn("magic mismatch ip={} name={}", ip, originalFilename);
            resp.put("error", "文件内容与类型不匹配");
            return ResponseEntity.badRequest().body(resp);
        }

        // 重命名为最终文件名
        String finalName = UUID.randomUUID().toString().replace("-", "") + EXT_BY_TYPE.get(ext);
        Path finalPath = Paths.get(uploadDir, finalName);
        try {
            Files.move(tmpPath, finalPath, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            log.error("rename failed ip={} err={}", ip, e.getMessage());
            safeDelete(tmpPath);
            resp.put("error", "服务器内部错误，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }

        // 显式设置文件权限（仅 owner 可读写）
        try {
            Set<PosixFilePermission> perms = Set.of(
                    PosixFilePermission.OWNER_READ,
                    PosixFilePermission.OWNER_WRITE
            );
            Files.setPosixFilePermissions(finalPath, perms);
        } catch (UnsupportedOperationException ignored) {
            // 非 POSIX 系统（如 Windows）忽略
        } catch (IOException e) {
            log.warn("set perms failed ip={} err={}", ip, e.getMessage());
        }

        String url = publicBase + "/" + finalName;
        log.info("upload ok ip={} file={} size={}", ip, finalName, file.getSize());
        resp.put("url", url);
        return ResponseEntity.ok(resp);
    }

    /**
     * 通用文件上传接口：用于 sEditor 的「文件」功能（插入下载链接，非图片）
     * 成功响应：{ "url": "...", "name": "原始文件名.pdf" }
     */
    @PostMapping("/upload-file")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file,
                                                          HttpServletRequest req) {
        Map<String, String> resp = new HashMap<>();
        String ip = clientIp(req);

        // 速率限制
        if (!rateLimitConfig.allow(ip)) {
            log.warn("upload-file rate-limited ip={}", ip);
            resp.put("error", "请求过于频繁，请稍后再试");
            return ResponseEntity.status(429).body(resp);
        }

        // 鉴权
        if (!uploadToken.isEmpty()) {
            String auth = req.getHeader("Authorization");
            if (!("Bearer " + uploadToken).equals(auth)) {
                log.warn("upload-file unauthorized ip={}", ip);
                resp.put("error", "未授权");
                return ResponseEntity.status(401).body(resp);
            }
        }

        if (file.isEmpty()) {
            resp.put("error", "未接收到文件");
            return ResponseEntity.badRequest().body(resp);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            resp.put("error", "文件名无效");
            return ResponseEntity.badRequest().body(resp);
        }

        // 扩展名黑名单校验
        String ext = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0 && dotIdx < originalFilename.length() - 1) {
            ext = originalFilename.substring(dotIdx).toLowerCase();
        }
        if (ext.isEmpty()) {
            resp.put("error", "文件名缺少扩展名");
            return ResponseEntity.badRequest().body(resp);
        }
        if (FILE_EXT_BLACKLIST.contains(ext)) {
            log.warn("upload-file rejected ip={} ext={}", ip, ext);
            resp.put("error", "不允许上传 " + ext + " 类型的文件");
            return ResponseEntity.badRequest().body(resp);
        }

        if (file.getSize() > fileMaxSize) {
            resp.put("error", String.format("文件过大，最大支持 %.1fMB", fileMaxSize / 1024.0 / 1024.0));
            return ResponseEntity.badRequest().body(resp);
        }

        // 校验上传目录
        File dir = new File(uploadDir);
        try {
            if (!dir.exists() && !dir.mkdirs()) {
                throw new IOException("无法创建上传目录: " + uploadDir);
            }
            if (!dir.isDirectory()) {
                throw new IOException("上传路径不是目录: " + uploadDir);
            }
        } catch (IOException e) {
            log.error("upload dir invalid ip={} err={}", ip, e.getMessage());
            resp.put("error", "服务器内部错误，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }

        // 随机文件名（保留原扩展名）
        String finalName = UUID.randomUUID().toString().replace("-", "") + ext;
        Path finalPath = Paths.get(uploadDir, finalName);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, finalPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("save failed ip={} err={}", ip, e.getMessage());
            resp.put("error", "服务器内部错误，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }

        // 显式设置文件权限（仅 owner 可读写）
        try {
            Set<PosixFilePermission> perms = Set.of(
                    PosixFilePermission.OWNER_READ,
                    PosixFilePermission.OWNER_WRITE
            );
            Files.setPosixFilePermissions(finalPath, perms);
        } catch (UnsupportedOperationException ignored) {
            // 非 POSIX 系统（如 Windows）忽略
        } catch (IOException e) {
            log.warn("set perms failed ip={} err={}", ip, e.getMessage());
        }

        String url = publicBase + "/" + finalName;
        log.info("upload-file ok ip={} file={} original={} size={}", ip, finalName, originalFilename, file.getSize());
        resp.put("url", url);
        resp.put("name", originalFilename);
        return ResponseEntity.ok(resp);
    }

    private boolean verifyMagic(Path path, String ext) {
        byte[] expected = MAGIC_BYTES.get(ext);
        if (expected == null) return false;
        try (InputStream in = Files.newInputStream(path)) {
            byte[] head = new byte[expected.length];
            int read = in.read(head);
            if (read < expected.length) return false;
            for (int i = 0; i < expected.length; i++) {
                if (head[i] != expected[i]) return false;
            }
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private void safeDelete(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleSize(MaxUploadSizeExceededException e) {
        Map<String, String> resp = new HashMap<>();
        resp.put("error", "文件过大");
        return ResponseEntity.status(413).body(resp);
    }
}
