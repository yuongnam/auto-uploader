import os
import json
import time
import random
import logging
import subprocess
import datetime
from pathlib import Path
from loguru import logger
import boto3
import yt_dlp
from botocore.exceptions import ClientError

# === 配置加载 ===
def load_config():
    config_path = Path(__file__).parent.parent / "config.json"
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    # 从环境变量覆盖（GitHub Actions 传入）
    import os
    storage = cfg["storage"]
    if os.getenv("OSS_ENDPOINT"): storage["endpoint"] = os.getenv("OSS_ENDPOINT")
    if os.getenv("OSS_BUCKET"): storage["bucket"] = os.getenv("OSS_BUCKET")
    if os.getenv("OSS_AK"): storage["access_key_id"] = os.getenv("OSS_AK")
    if os.getenv("OSS_SK"): storage["access_key_secret"] = os.getenv("OSS_SK")
    if os.getenv("OSS_REGION"): storage["region"] = os.getenv("OSS_REGION")
    return cfg

cfg = load_config()

# === 工具函数 ===
def random_sleep(a=1, b=3):
    time.sleep(random.uniform(a, b))

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def run_cmd(cmd, check=True, capture_output=True):
    logger.debug(f"Run: {cmd}")
    result = subprocess.run(cmd, shell=True, text=True, capture_output=capture_output)
    if check and result.returncode != 0:
        logger.error(f"Command failed: {result.stderr}")
        raise RuntimeError(result.stderr)
    return result.stdout.strip() if capture_output else result.returncode

# === 下载视频 ===
def download_video(url, out_dir):
    ydl_opts = {
        "outtmpl": str(Path(out_dir) / "%(id)s.%(ext)s"),
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "ignoreerrors": True,
        "noplaylist": True,
        "extract_flat": False,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if not filename.endswith(".mp4"):
                mp4_name = Path(filename).with_suffix(".mp4")
                run_cmd(f'ffmpeg -i "{filename}" -c copy "{mp4_name}" -y')
                filename = str(mp4_name)
            return filename, info
    except Exception as e:
        logger.error(f"下载失败 {url}: {e}")
        return None, None

# === 去重处理 ===
def deduplicate_video(input_path, output_path, steps):
    filters = []
    output_opts = ["-c:v", "libx264", "-preset", "fast", "-crf", "23"]

    if "crop" in steps:
        filters.append("crop=iw*0.96:ih*0.96:iw*0.02:ih*0.02")
    if "mirror" in steps:
        filters.append("hflip")
    if "filter" in steps:
        filters.append("eq=brightness=0.05:contrast=0.95:saturation=0.95")
        filters.append("unsharp=5:5:1.0:5:5:0.0")
    if "speed" in steps:
        speed_factor = random.uniform(0.9, 1.3)
        output_opts.extend(["-filter:v", f"setpts={1/speed_factor}*PTS"])
        output_opts.extend(["-af", f"atempo={speed_factor}"])

    if filters:
        vfilter = ",".join(filters)
        output_opts = ["-vf", vfilter] + output_opts

    cmd = f'ffmpeg -i "{input_path}" {" ".join(output_opts)} "{output_path}" -y'
    run_cmd(cmd)
    return output_path

# === 搜索热门视频 ===
def search_videos():
    query = cfg["source"]["query"]
    max_results = cfg["source"]["max_results"]
    min_views = cfg["source"]["min_views"]

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "forcejson": True,
        "noplaylist": True,
    }

    urls = []
    search_url = f"ytsearch{max_results}:{query}"
    ydl_opts["extract_flat"] = True

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(search_url, download=False)
        if "entries" not in result:
            return []
        for entry in result["entries"]:
            if entry and entry.get("view_count", 0) >= min_views:
                urls.append(entry["url"])
        random.shuffle(urls)
    return urls

# === 上传到阿里云 OSS ===
def upload_to_oss(local_path, object_name):
    oss_cfg = cfg["storage"]
    client = boto3.client(
        "oss",
        endpoint_url=oss_cfg["endpoint"],
        aws_access_key_id=oss_cfg["access_key_id"],
        aws_secret_access_key=oss_cfg["access_key_secret"],
        region_name=oss_cfg["region"]
    )
    bucket = oss_cfg["bucket"]
    key = f"{oss_cfg['path_prefix']}/{object_name}"
    logger.info(f"上传到 OSS: {key}")
    client.upload_file(local_path, bucket, key)
    try:
        client.put_object_acl(ACL="public-read", Bucket=bucket, Key=key)
    except Exception:
        pass
    url = f"{oss_cfg['endpoint']}/{bucket}/{key}"
    return url

def upload_queue_to_oss(queue_file_path):
    oss_cfg = cfg["storage"]
    client = boto3.client(
        "oss",
        endpoint_url=oss_cfg["endpoint"],
        aws_access_key_id=oss_cfg["access_key_id"],
        aws_secret_access_key=oss_cfg["access_key_secret"],
        region_name=oss_cfg["region"]
    )
    bucket = oss_cfg["bucket"]
    key = f"{oss_cfg['path_prefix']}/publish_queue.json"
    logger.info(f"上传队列到 OSS: {key}")
    client.upload_file(queue_file_path, bucket, key, ExtraArgs={'ACL': 'public-read'})
    return f"{oss_cfg['endpoint']}/{bucket}/{key}"

# === 生成标题和话题 ===
def generate_metadata():
    kuaishou = cfg["publish"]["kuaishou"]
    douyin = cfg["publish"]["douyin"]
    title_ks = random.choice(kuaishou["default_titles"])
    title_dy = random.choice(douyin["default_titles"])
    topics_ks = " ".join(kuaishou["default_topics"])
    topics_dy = " ".join(douyin["default_topics"])
    return title_ks, title_dy, topics_ks, topics_dy

# === 主流程 ===
def main():
    logger.info("开始自动搬运任务")
    ensure_dir(cfg["source"]["download_dir"])

    urls = search_videos()
    logger.info(f"找到 {len(urls)} 个候选视频")
    random.shuffle(urls)

    processed = []
    kuaishou_remaining = cfg["publish"]["kuaishou"]["count_per_day"]
    douyin_remaining = cfg["publish"]["douyin"]["count_per_day"]

    for url in urls:
        if kuaishou_remaining <= 0 and douyin_remaining <= 0:
            break
        random_sleep(2, 5)

        local_file, info = download_video(url, cfg["source"]["download_dir"])
        if not local_file:
            continue
        logger.info(f"下载完成: {local_file}, 时长 {info.get('duration', 0)}s")

        deduped_path = str(Path(local_file).with_name(f"dedup_{Path(local_file).name}"))
        deduplicate_video(local_file, deduped_path, cfg["deduplication"]["steps"])

        object_name = f"{int(time.time())}_{Path(deduped_path).name}"
        oss_url = upload_to_oss(deduped_path, object_name)

        title_ks, title_dy, topics_ks, topics_dy = generate_metadata()

        record = {
            "timestamp": int(time.time()),
            "original_url": url,
            "video_url": oss_url,
            "title_kuaishou": title_ks,
            "topics_kuaishou": topics_ks,
            "title_douyin": title_dy,
            "topics_douyin": topics_dy,
            "platforms": [],
            "status": "pending"
        }
        if kuaishou_remaining > 0:
            record["platforms"].append("kuaishou")
            kuaishou_remaining -= 1
        if douyin_remaining > 0:
            record["platforms"].append("douyin")
            douyin_remaining -= 1

        queue_file = Path(__file__).parent.parent / "publish_queue.json"
        with open(queue_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        processed.append(record)
        logger.success(f"视频已加入发布队列: {object_name}")

    logger.info(f"任务完成，处理了 {len(processed)} 个视频")

    queue_file = Path(__file__).parent.parent / "publish_queue.json"
    queue_url = upload_queue_to_oss(str(queue_file))
    logger.success(f"队列已更新: {queue_url}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception("任务异常")
        raise
