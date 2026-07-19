// sEditor 图片上传后端模板 — Java (Spring Boot)
//
// 项目结构：
// src/main/java/com/example/upload/UploadApplication.java
// src/main/java/com/example/upload/UploadController.java
// src/main/resources/application.yml
//
// 依赖（pom.xml）：spring-boot-starter-web、spring-boot-starter-validation
//
// 启动后访问：http://localhost:8080/api/upload
//
// 成功响应：{ "url": "https://.../xxx.png" }
// 失败响应：{ "error": "错误信息" }

package com.example.upload;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@SpringBootApplication
public class UploadApplication {
    public static void main(String[] args) {
        SpringApplication.run(UploadApplication.class, args);
    }
}

@Configuration
class WebConfig implements WebMvcConfigurer {
    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + new File(uploadDir).getAbsolutePath() + "/")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
    }
}

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
class UploadController {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Value("${upload.max-size:5242880}")
    private long maxSize;

    @Value("${upload.public-base:http://localhost:8080/uploads}")
    private String publicBase;

    private static final Set<String> ALLOWED_EXT = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "svg"
    );

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        Map<String, String> resp = new HashMap<>();

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
            resp.put("error", "不支持的文件类型，仅支持 jpg/png/gif/webp/svg");
            return ResponseEntity.badRequest().body(resp);
        }

        if (file.getSize() > maxSize) {
            resp.put("error", "文件过大，最大支持 " + (maxSize / 1024 / 1024) + "MB");
            return ResponseEntity.badRequest().body(resp);
        }

        try {
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String filename = UUID.randomUUID().toString().replace("-", "") + "." + ext;
            Path dest = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String url = publicBase + "/" + filename;
            resp.put("url", url);
            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            resp.put("error", "文件保存失败：" + e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }
}
