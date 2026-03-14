#!/data/data/com.termux/files/usr/bin/python3
import time, re
LOG = '/data/data/com.termux/files/home/.openclaw/workspace/telegram.log'
PAT = re.compile(r'failed login|unauthorized|error')
while True:
    with open(LOG) as f:
        for line in f:
            if PAT.search(line.lower()):
                print(f"[ALERT] {line.strip()}")
    time.sleep(10)
