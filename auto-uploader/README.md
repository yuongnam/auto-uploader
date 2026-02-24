# 全自动搬运系统 - 搞笑领域

## 快速开始

1. 准备环境（云平台 + 安卓手机）
2. 配置 `config.json`
3. 部署云函数
4. 安装手机端 Auto.js 脚本
5. 启动，搞定

详细步骤见 `deploy/` 目录。

---

## 文件结构

```
├── README.md                 # 本文件
├── config.json              # 核心配置（API密钥、OSS、发布计划）
├── cloud/                   # 云函数代码
│   ├── main.py
│   ├── requirements.txt
│   └── vercel.json         # Vercel配置（可选）
├── android/                 # 手机端 Auto.js 脚本
│   ├── auto_publisher.js
│   └── README.md
├── templates/               # 剪映模板（可选）
└── deploy/                  # 分步部署指南
    ├── 01-cloud-setup.md
    ├── 02-android-setup.md
    └── 03-test-run.md
```

---

## 功能

- **定时抓取**：每小时搜索 YouTube/TikTok 搞笑热门视频
- **自动去重**：FFmpeg 镜像/裁剪/滤镜/变速/BGM 替换
- **多云存储**：支持阿里云 OSS、腾讯云 COS、GitHub Releases
- **自动发布**：手机端监控新视频，自动打开 App 并发布
- **反爬虫**：随机 User-Agent、间隔控制、失败重试

---

## 成本

- 云函数：免费额度足够（Vercel/腾讯云/Aliyun FC）
- 对象存储：阿里云 OSS 5GB 免费
- 手机：已有安卓机 + Auto.js Pro (¥30)

---

## 配置完成后

每天自动运行：
- 快手发布 2 条
- 抖音发布 1 条
- 发布时间可配置（建议早中晚高峰）

---

**下一步**：按 `deploy/01-cloud-setup.md` 开始。
