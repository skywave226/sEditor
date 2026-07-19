<?php
// sEditor 图片上传后端模板 — PHP (原生，零依赖)
//
// 将此文件放入 Web 服务器（Apache/Nginx）的可访问目录，例如 upload.php
// 确保同一目录下有 uploads/ 子目录且 PHP 进程有写入权限
//
// 接口：POST /api/upload.php （或根据你的部署路径调整）
// 请求：multipart/form-data，字段名 file
// 成功响应：{ "url": "https://.../xxx.png" }
// 失败响应：{ "error": "错误信息" }

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 配置
$UPLOAD_DIR = __DIR__ . '/uploads';
$MAX_SIZE = 5 * 1024 * 1024; // 5MB
$ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
// 访问静态资源的 URL 前缀（请根据实际部署修改）
$PUBLIC_BASE = 'http://localhost:8000/uploads';

// 确保上传目录存在
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// 检查是否有文件上传
if (!isset($_FILES['file'])) {
    fail('未接收到文件');
}

$file = $_FILES['file'];

// 检查上传错误
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE => '文件过大（超过 php.ini 限制）',
        UPLOAD_ERR_FORM_SIZE => '文件过大（超过表单限制）',
        UPLOAD_ERR_PARTIAL => '文件只被部分上传',
        UPLOAD_ERR_NO_FILE => '没有文件被上传',
        UPLOAD_ERR_NO_TMP_DIR => '找不到临时文件夹',
        UPLOAD_ERR_CANT_WRITE => '文件写入失败',
        UPLOAD_ERR_EXTENSION => 'PHP 扩展停止了文件上传',
    ];
    fail($errors[$file['error']] ?? '上传失败');
}

// 大小检查
if ($file['size'] > $MAX_SIZE) {
    fail('文件过大，最大支持 ' . intval($MAX_SIZE / 1024 / 1024) . 'MB');
}

// 扩展名检查
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $ALLOWED_EXT)) {
    fail('不支持的文件类型，仅支持 jpg/png/gif/webp/svg');
}

// 生成随机文件名
$filename = bin2hex(random_bytes(16)) . '.' . $ext;
$dest = $UPLOAD_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    fail('文件保存失败', 500);
}

// 返回 URL
$url = $PUBLIC_BASE . '/' . $filename;
echo json_encode(['url' => $url], JSON_UNESCAPED_UNICODE);
