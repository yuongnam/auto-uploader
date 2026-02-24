# 🎯 完整代码 - 手动下载与更多工具

## cloud/main.py 完整版（包含队列到OSS上传）

```python
# ... 同上，增加以下函数 ...
def upload_queue_to_oss(queue_file_path):
    """将发布队列上传到 OSS，返回公开URL"""
    oss_cfg = cfg["storage"]
    key = f"{oss_cfg['path_prefix']}/publish_queue.json"
    client = boto3.client(
        "oss",
        endpoint_url=oss_cfg["endpoint"],
        aws_access_key_id=oss_cfg["access_key_id"],
        aws_secret_access_key=oss_cfg["access_key_secret"],
    )
    client.upload_file(queue_file_path, oss_cfg["bucket"], key, ExtraArgs={'ACL': 'public-read'})
    return f"{oss_cfg['endpoint']}/{oss_cfg['bucket']}/{key}"
```

并在 `main()` 最后调用：

```python
queue_file = Path(__file__).parent.parent / "publish_queue.json"
queue_url = upload_queue_to_oss(str(queue_file))
logger.info(f"队列已上传: {queue_url}")
```

这样手机就能直接从 OSS 拉取 `publish_queue.json`。

---

---

## 安卓 Auto.js 完整版（稳定控件版）

如果坐标不准，建议用控件查找：

```javascript
// 替代 click(0.5, 0.95)
function clickByText(text, className="android.widget.Button") {
    var node = ui.findViewById(text).findOne(5000);
    if (node) {
        node.click();
        return true;
    }
    return false;
}

// 发布流程示例：
function publishDouyin(item) {
    app.launchApp("com.ss.android.ugc.aweme");
    sleep(8000);

    // 点击「+」
    if (!clickByText("发布")) {
        click(0.5, 0.95); // fallback
    }
    // ... 后续步骤类似地使用文本查找
}
```

`ui` 模式需要在前面的 `///` 注释声明权限，Auto.js Pro 支持。

---

## 部署检查清单

- [ ] 阿里云 OSS Bucket 创建，权限公共读
- [ ] Vercel 部署完成，配置 cron
- [ ] `config.json` 中的 OSS 信息正确
- [ ] 手机 Auto.js 脚本能下载 `publish_queue.json`（浏览器打开测试）
- [ ] 手机脚本日志正常
- [ ] 抖音/快手小号已登录，主页能看到「+」按钮
- [ ] 首次测试手动触发云函数，观察手机执行

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 云函数报错 `No module named 'boto3'` | 依赖未安装 | 在 `cloud/` 目录 `pip install -r requirements.txt` |
| 手机无法下载队列文件 | 网络或 URL 错误 | 用浏览器访问 URL 确认可下载 |
| 点击坐标偏移 | 屏幕比例不同 | 改用 `ui` 控件查找或调整相对坐标 |
| OSS 上传失败 403 | AK/SK 或 Bucket 权限 | 检查 RAM 权限、Bucket ACL |
| 视频发布后消音/审核不通过 | 内容敏感或去重不足 | 加强去重、避免搬运版权内容 |

---

祝你成功！需要其他帮助（如剪映模板、ChatGPT生成标题）我再补充。
