#!/usr/bin/env bash
set -e

echo "======================================================"
echo "    ADORA — Automated Oracle Cloud Setup Script       "
echo "======================================================"

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo ./setup-oracle.sh)"
  exit 1
fi

echo "[1/6] Updating Ubuntu packages..."
apt update && apt upgrade -y

echo "[2/6] Installing Docker, Docker Compose, Fail2ban, and UFW..."
apt install -y curl ufw fail2ban ca-certificates apt-transport-https gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-compose

echo "[3/6] Hardening Firewall (UFW) - Zero Open Inbound Ports..."
ufw default deny incoming
ufw default allow outgoing
# Allow SSH temporarily from current session (user can switch to Cloudflare Access SSH later)
ufw allow 22/tcp
echo "y" | ufw enable

echo "[4/6] Configuring Fail2ban..."
cat << 'F2B' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
F2B
systemctl restart fail2ban

echo "[5/6] Deploying Adora Keep-Alive Systemd Timer..."
mkdir -p /opt/adora/server/scripts
cp adora-keepalive.sh /opt/adora/server/scripts/
chmod +x /opt/adora/server/scripts/adora-keepalive.sh
cp adora-keepalive.service /etc/systemd/system/
cp adora-keepalive.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now adora-keepalive.timer

echo "[6/6] Creating Persistent Storage Directories..."
mkdir -p /opt/adora/data /opt/adora/music
chown -R 1000:1000 /opt/adora/data /opt/adora/music

echo "======================================================"
echo "[+] Oracle Cloud VM successfully hardened and ready! "
echo "    - Keep-Alive watchdog active (prevents reclamation)"
echo "    - Firewall active (zero open web ports)"
echo "    - Fail2ban active"
echo "======================================================"
