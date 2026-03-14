# Suricata 快速入门 (Termux)

## 安装（需 root 或 proot-distro）
pkg install clang make libpcap openssl-dev
git clone https://github.com/OISF/suricata.git
cd suricata && ./configure && make && make install

## 运行
suricata -c suricata.yaml -i wlan0
