<?php
// sEditor 文件上传后端模板 — PHP (原生，零依赖)
//
// 用于 sEditor 的「文件」功能（插入下载链接，非图片）
// 将此文件放入 Web 服务器（Apache/Nginx）的可访问目录，例如 upload-file.php
// 确保同一目录下有 uploads/ 子目录且 PHP 进程有写入权限
//
// 环境变量（推荐通过 .env 或 docker-compose 注入；$_ENV 默认可能为空，可用 getenv()）：
//   PUBLIC_BASE    静态资源访问 URL 前缀（默认 http://localhost:8000/uploads）
//   CORS_ORIGIN    允许的来源，逗号分隔（默认 http://localhost:5173）
//   UPLOAD_TOKEN   上传鉴权 token，留空则不鉴权（仅开发用）
//   FILE_MAX_SIZE  单文件大小上限，字节（默认 20MB）
//   RATE_LIMIT     每 IP 每分钟上传次数（默认 10）
//
// 接口：POST /api/upload-file.php
// 请求：multipart/form-data，字段名 file
// 鉴权：Authorization: Bearer <UPLOAD_TOKEN>（若配置了 UPLOAD_TOKEN）
// 成功响应：{ "url": "https://.../xxx.pdf", "name": "原始文件名.pdf" }
// 失败响应：{ "error": "错误信息" }

header('Content-Type: application/json; charset=utf-8');

// ============ 配置 ============
$UPLOAD_DIR = __DIR__ . '/uploads';
$FILE_MAX_SIZE = intval(getenv('FILE_MAX_SIZE') ?: 20 * 1024 * 1024);
$PUBLIC_BASE = getenv('PUBLIC_BASE') ?: 'http://localhost:8000/uploads';
$CORS_ORIGIN = getenv('CORS_ORIGIN') ?: 'http://localhost:5173';
$UPLOAD_TOKEN = getenv('UPLOAD_TOKEN') ?: '';
$RATE_LIMIT = intval(getenv('RATE_LIMIT') ?: 10);

// 文件扩展名黑名单：禁止可执行/脚本/HTML 等危险类型
$FILE_EXT_BLACKLIST = [
    '.html', '.htm', '.xhtml', '.svg', '.xml',
    '.js', '.mjs', '.ts', '.jsx', '.tsx',
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi',
    '.php', '.jsp', '.asp', '.aspx',
    '.jar', '.war', '.class',
    '.py', '.rb', '.pl',
    '.env', '.config', '.ini',
];

// CORS 白名单
$origin_list = array_map('trim', explode(',', $CORS_ORIGIN));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $origin_list, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 确保上传目录存在
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

// ============ 工具函数 ============
function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function client_ip() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function log_line($level, $msg) {
    $ts = date('c');
    $line = json_encode(['ts' => $ts, 'level' => $level, 'msg' => $msg], JSON_UNESCAPED_UNICODE);
    error_log($line);
}

// ============ 速率限制（基于文件，跨进程） ============
function rate_limit_check($ip, $limit) {
    $dir = sys_get_temp_dir() . '/seditor-rate';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $file = $dir . '/' . md5($ip);
    $now = time();
    $window = 60;
    $data = ['count' => 0, 'reset_at' => $now + $window];
    if (is_file($file)) {
        $raw = @file_get_contents($file);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['count'], $decoded['reset_at'])) {
                $data = $decoded;
            }
        }
    }
    if ($now > $data['reset_at']) {
        $data = ['count' => 1, 'reset_at' => $now + $window];
    } else {
        $data['count']++;
    }
    @file_put_contents($file, json_encode($data), LOCK_EX);
    return $data['count'] <= $limit;
}

// ============ 鉴权 ============
function auth_check($token) {
    if ($token === '') return true;
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return hash_equals('Bearer ' . $token, $auth);
}

// ============ 主流程 ============
$ip = client_ip();

if (!rate_limit_check($ip, $RATE_LIMIT)) {
    log_line('warn', "upload-file rate-limited ip=$ip");
    fail('请求过于频繁，请稍后再试', 429);
}

if (!auth_check($UPLOAD_TOKEN)) {
    log_line('warn', "upload-file unauthorized ip=$ip");
    fail('未授权', 401);
}

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
if ($file['size'] > $FILE_MAX_SIZE) {
    fail('文件过大，最大支持 ' . intval($FILE_MAX_SIZE / 1024 / 1024) . 'MB');
}

// 扩展名黑名单校验
$original_name = $file['name'] ?? 'file';
$ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
if ($ext === '') {
    fail('文件名缺少扩展名');
}
$dot_ext = '.' . $ext;
if (in_array($dot_ext, $FILE_EXT_BLACKLIST, true)) {
    log_line('warn', "upload-file rejected ip=$ip ext=$dot_ext");
    fail("不允许上传 $dot_ext 类型的文件");
}

// 生成随机文件名（保留原扩展名）
$filename = bin2hex(random_bytes(16)) . '.' . $ext;
$dest = $UPLOAD_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    log_line('error', "save failed ip=$ip");
    fail('文件保存失败', 500);
}

// 显式设置权限
chmod($dest, 0640);

$url = $PUBLIC_BASE . '/' . $filename;
log_line('info', "upload-file ok ip=$ip file=$filename original=$original_name size=" . $file['size']);
echo json_encode(['url' => $url, 'name' => $original_name], JSON_UNESCAPED_UNICODE);
