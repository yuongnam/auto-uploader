# Auto.js Pro 脚本 - 自动发布短视频

## 功能
- 轮询阿里云 OSS 新视频（本地记录上次检查时间）
- 自动下载最新待发布视频
- 自动打开抖音/快手 App，模拟点击发布
- 自动填写标题、话题，点击发布
- 记录成功/失败，避免重复

---

## 配置

在脚本开头修改：

```javascript
var CONFIG = {
    OSS_BUCKET: "your-bucket-name",
    OSS_ENDPOINT: "https://oss-cn-hangzhou.aliyuncs.com",
    OSS_AK: "YOUR_ACCESS_KEY_ID",
    OSS_SK: "YOUR_ACCESS_KEY_SECRET",
    OSS_PREFIX: "videos/funny",
    QUEUE_FILE: "/sdcard/auto_uploader/queue.json",
    DOWNLOAD_DIR: "/sdcard/Movies/auto_uploader",
    PLATFORMS: ["kuaishou", "douyin"], // 你要发布的平台
    CHECK_INTERVAL: 300, // 5分钟检查一次
    WAIT_AFTER_OPEN: 5000, // 打开App后等待 ms
    TYPING_DELAY: 100, // 打字间隔 ms
};
```

---

## 安装

1. 在 Auto.js Pro 中新建项目，复制 `auto_publisher.js` 内容
2. 修改配置中的密钥和Bucket
3. 申请无障碍服务、显示在其他应用上层、电池优化忽略等权限
4. 首次运行会创建目录和队列文件

---

## 工作原理

1. 每隔 `CHECK_INTERVAL` 毫秒，从 `publish_queue.json` 读取待发布记录
2. 如果有新记录，下载视频到 `DOWNLOAD_DIR`
3. 依次对每个平台：
   a. 打开 App（包名 `com.kuaishou.nebula` 和 `com.ss.android.ugc.aweme`）
   b. 等待首页加载
   c. 点击「+」发布按钮（坐标根据屏幕分辨率适配）
   d. 选择视频（自动点击第一个）
   e. 填写标题和话题
   f. 点击发布
   g. 记录结果
4. 睡眠到下次检查

---

## 备注

- 坐标位置可能需要根据你的手机分辨率调整（在 `click` 按钮部分）
- 建议先用测试模式（只下载不发布）验证流程
- 发布间隔建议 > 30分钟，避免风控
- 保持手机亮屏、充电，Auto.js 常驻后台

---

## 完整脚本

见下。
