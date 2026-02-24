{
  "cloud": {
    "provider": "vercel",
    "schedule": "0 * * * *",
    "timezone": "Asia/Shanghai"
  },
  "source": {
    "platforms": ["youtube", "tiktok"],
    "query": "funny",
    "max_results": 50,
    "min_duration": 15,
    "max_duration": 300,
    "min_views": 1000,
    "download_dir": "/tmp/downloads"
  },
  "deduplication": {
    "mode": "standard",
    "steps": ["crop", "mirror", "filter", "speed", "bgm", "subtitle", "overlay"],
    "output_resolution": "1080p",
    "output_fps": 30,
    "output_bitrate": 8000
  },
  "storage": {
    "provider": "aliyun_oss",
    "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
    "bucket": "yuongnam",
    "region": "cn-hangzhou",
    "access_key_id": "LTAI5t7hEhmnt8NPGY4NHoFc",
    "access_key_secret": "tNqWdXEeAZjkzGZBauS5sK73siuk1N",
    "path_prefix": "videos/funny"
  },
  "publish": {
    "kuaishou": {
      "enabled": true,
      "count_per_day": 2,
      "schedule_hours": [12, 19, 20],
      "default_titles": ["笑死我了！这谁顶得住！😆", "太有才了！哈哈哈哈😂", "每天一条搞笑视频，烦恼全忘掉！"],
      "default_topics": ["#搞笑", "#幽默", "#日常"]
    },
    "douyin": {
      "enabled": true,
      "count_per_day": 1,
      "schedule_hours": [18, 21],
      "default_titles": ["哈哈这也太逗了！🤣", "快乐每一天，搞笑不间断～"],
      "default_topics": ["#搞笑", "#幽默"]
    }
  },
  "logging": {
    "level": "INFO",
    "retention_days": 7
  }
}
