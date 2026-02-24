# 第1步：配置云函数

### 1.1 创建 Vercel 项目

```bash
cd auto-uploader/cloud
vercel --prod
```

按提示登录、设置项目名、使用默认设置。

部署完成后，你会得到一个 URL，类似：
`https://your-project.vercel.app/api/main`

### 1.2 设置环境变量（可选）

Vercel 函数使用 `config.json`，无需额外环境变量。但如果你想把密钥放在环境变量中，可以：

- Vercel Dashboard → Project Settings → Environment Variables
  - `OSS_AK`
  - `OSS_SK`
  - `OSS_BUCKET`

然后在 `main.py` 中使用 `os.getenv` 读取。当前版本使用 `config.json`。

---

# 第2步：配置手机端 Auto.js

### 2.1 修改脚本配置

打开 `android/auto_publisher.js`，修改：

```javascript
var CONFIG = {
    OSS_BUCKET: "your-bucket-name", // 改
    OSS_AK: "YOUR_ACCESS_KEY_ID", // 改
    OSS_SK: "YOUR_ACCESS_KEY_SECRET", // 改
    QUEUE_URL: "https://your-project.vercel.app/api/queue", // 你的公开地址
    ...
};
```

### 2.2 让队列文件能被手机访问

 easiest: 把 `publish_queue.json` 放到 GitHub Gist 或 Releases，设置为 Raw 链接可直接下载。

或者：让云函数直接返回这个文件内容（推荐）：

修改 `cloud/main.py` 在 `main()` 函数末尾添加：

```python
# 写入队列到公开地址（需要把文件放到 OSS 或 Web）
# 这里简单返回 JSON（Vercel 函数可以多路由）
# 见 deploy/03-adjust-api.md
```

由于 Vercel 单函数，我们后面步骤会拆分。

---

# 第3步：本地测试（电脑）

在电脑上运行 `cloud/main.py` 测试：

```bash
cd auto-uploader
python3 -m venv .venv
source .venv/bin/activate
pip install -r cloud/requirements.txt
python cloud/main.py
```

观察：
- 是否下载视频到 `/tmp/downloads`
- 是否成功上传 OSS
- `publish_queue.json` 是否新增记录

**注意**：`publish_queue.json` 需要保存到可公开访问的位置。最简单的：每次运行完后手动上传到 GitHub Raw。

自动化方案：add `upload_queue_to_github()` 函数（后续补充）。

---

# 第4步：校准坐标

手机上的抖音/快手界面可能与脚本中的相对坐标不符：

1. 在 Auto.js 中运行脚本，会弹出悬浮窗
2. 点击「布局分析」或使用 `click(0.5,0.95)` 时观察是否正确点击
3. 如果不准，用 `ui` 控件查找或截图坐标计算

常见分辨率：
- 1080x2400：相对坐标约0.5对应中点
- 调整 `click` 参数直到准确

---

# 第5步：小规模试运行

1. 手机挂机，脚本运行
2. 手动触发云函数一次
3. 等待5分钟内手机拉取到新任务
4. 观察是否自动发布成功
5. 查看抖音/快手后台草稿或已发布，确认内容

**成功标志**：视频出现在你账号中，标题和话题正确。

---

# 后续优化

- 使用数据库（Supabase）替代 JSON 队列
- 用更稳定控件定位替代绝对坐标
- 加入随机时间间隔、随机动作模拟，降低风控
- 加入视频原声替换（完全去重）

---

有问题随时提出。
