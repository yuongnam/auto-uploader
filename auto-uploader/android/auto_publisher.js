/**
 * AutoUploader - 自动搬运发布脚本 (Android Auto.js Pro)
 * 2025-02-23
 */

var CONFIG = {
    // 阿里云 OSS 配置
    OSS_ENDPOINT: "https://oss-cn-hangzhou.aliyuncs.com",
    OSS_BUCKET: "your-bucket-name",
    OSS_AK: "YOUR_ACCESS_KEY_ID",
    OSS_SK: "YOUR_ACCESS_KEY_SECRET",
    OSS_PREFIX: "videos/funny",

    // 本地队列文件（云函数写入，手机轮询）
    QUEUE_URL: "https://your-domain.com/publish_queue.json", // 放到OSS公开区域或GitHub Raw

    // 本地存储
    DOWNLOAD_DIR: "/sdcard/Movies/auto_uploader",
    STATE_FILE: "/sdcard/auto_uploader/state.json",
    LOG_FILE: "/sdcard/auto_uploader/log.txt",

    // 目标平台
    PLATFORMS: ["kuaishou", "douyin"],

    // 时间间隔
    CHECK_INTERVAL: 5 * 60 * 1000, // 5分钟
    WAIT_AFTER_OPEN: 8000, // 打开App后等待
    TYPING_DELAY: 80, // 打字速度
    POST_INTERVAL: 30 * 60 * 1000, // 同一视频发布间隔

    // 屏幕尺寸（用于坐标）
    SCREEN_WIDTH: device.width,
    SCREEN_HEIGHT: device.height,
};

// === 初始化 ===
var files = GaragedFile("auto_uploader");
files.mkdirs();

function log(msg) {
    var time = new Date().toLocaleString();
    var line = `[${time}] ${msg}`;
    console.log(line);
    files.appendText("log.txt", line + "\n");
}

function loadState() {
    try {
        var content = files.readText("state.json");
        return JSON.parse(content);
    } catch (e) {
        return { last_check: 0, last_video_ts: 0, published: {} };
    }
}

function saveState(state) {
    files.writeText("state.json", JSON.stringify(state, null, 2));
}

function downloadFile(url, filename) {
    var dest = new File(CONFIG.DOWNLOAD_DIR, filename);
    var req = new HttpRequest(url);
    req.get();
    if (req.responseCode == 200) {
        dest.writeBytes(req.body.bytes);
        return dest.getAbsolutePath();
    } else {
        throw new Error("下载失败: " + req.responseCode);
    }
}

function getQueue() {
    // 从OSS公开URL下载队列文件
    var resp = http.get(CONFIG.QUEUE_URL);
    if (resp.statusCode == 200) {
        var lines = resp.body.string().split("\n").filter(l => l.trim());
        var items = lines.map(l => JSON.parse(l));
        return items;
    } else {
        log("获取队列失败: " + resp.statusCode);
        return [];
    }
}

function markPublished(item, platform) {
    var state = loadState();
    var key = item.timestamp + "_" + platform;
    state.published[key] = true;
    saveState(state);
    log(`${platform} 发布成功: ${item.title_${platform}}`);
}

function isPublished(item, platform) {
    var state = loadState();
    var key = item.timestamp + "_" + platform;
    return state.published && state.published[key];
}

// === 自动化操作抖音 ===
function publishDouyin(item) {
    var pkg = "com.ss.android.ugc.aweme";
    app.launchApp(pkg);
    sleep(CONFIG.WAIT_AFTER_OPEN);

    // 点击底部「+」
    click(0.5, 0.95); // 相对坐标
    sleep(3000);

    // 选择视频（第一个）
    click(0.3, 0.25);
    sleep(2000);

    // 点击「下一步」
    click(0.85, 0.95);
    sleep(3000);

    // 输入标题
    var title = item.title_douyin;
    var topics = item.topics_douyin;
    setClip(title);
    click(0.5, 0.25); // 标题框位置（需要根据实际UI调整）
    sleep(1000);
    app.paste();
    sleep(1000);

    // 输入话题（另起一行）
    click(0.5, 0.35);
    sleep(1000);
    setClip(topics);
    app.paste();
    sleep(1000);

    // 发布（底部发布按钮）
    click(0.5, 0.92);
    sleep(2000);
    // 确认（如果有二次确认）
    click(0.5, 0.85);
    sleep(5000);

    markPublished(item, "douyin");
}

// === 自动化操作快手 ===
function publishKuaishou(item) {
    var pkg = "com.kuaishou.nebula";
    app.launchApp(pkg);
    sleep(CONFIG.WAIT_AFTER_OPEN);

    // 点击底部「+」
    click(0.5, 0.95);
    sleep(3000);

    // 选择视频（第一个）
    click(0.3, 0.3);
    sleep(2000);

    // 点击「下一步」
    click(0.85, 0.95);
    sleep(3000);

    // 标题
    var title = item.title_kuaishou;
    var topics = item.topics_kuaishou;
    setClip(title);
    click(0.5, 0.25);
    sleep(1000);
    app.paste();
    sleep(1000);

    // 话题
    click(0.5, 0.35);
    sleep(1000);
    setClip(topics);
    app.paste();
    sleep(1000);

    // 发布
    click(0.5, 0.92);
    sleep(2000);
    click(0.5, 0.85);
    sleep(5000);

    markPublished(item, "kuaishou");
}

// === 主循环 ===
function mainLoop() {
    while (true) {
        try {
            var queue = getQueue();
            var now = Date.now();
            var state = loadState();

            for (var i = 0; i < queue.length; i++) {
                var item = queue[i];
                // 只处理未发布的
                for (var p = 0; p < CONFIG.PLATFORMS.length; p++) {
                    var platform = CONFIG.PLATFORMS[p];
                    if (item.platforms.includes(platform) && !isPublished(item, platform)) {
                        log(`准备发布 ${platform}: ${item.timestamp}`);
                        // 下载视频
                        var videoFile = downloadFile(item.video_url, item.timestamp + ".mp4");
                        // 推送到手机相册（可选）
                        // media.scanFile(videoFile);
                        // 发布
                        if (platform == "douyin") {
                            publishDouyin(item);
                        } else if (platform == "kuaishou") {
                            publishKuaishou(item);
                        }
                        sleep(CONFIG.POST_INTERVAL);
                    }
                }
            }

            state.last_check = now;
            saveState(state);

        } catch (e) {
            log("错误: " + e);
        }
        sleep(CONFIG.CHECK_INTERVAL);
    }
}

// === 启动 ===
log("AutoUploader 启动");
files.mkdirs(CONFIG.DOWNLOAD_DIR);
requestScreenCapture();
mainLoop();
