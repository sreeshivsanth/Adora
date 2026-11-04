#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "======================================================"
echo "    ADORA — Cloudflare Tunnel Local Runner            "
echo "    (Runs without Oracle Cloud — 100% Free)           "
echo "======================================================"

# Create persistent storage directories if they do not exist
mkdir -p "$DIR/data" "$DIR/music"

# Check for .env file or create default
if [ ! -f "$DIR/.env" ]; then
  echo "[+] Initializing server/.env configuration..."
  cat << 'EOF' > "$DIR/.env"
# Adora Cloudflare Configuration
ADMIN_JWT_SECRET=adora_secret_change_in_production_key_99
STORAGE_HIGH_WATERMARK_GB=160
STORAGE_TARGET_GB=140
TWO_FACTOR_ENABLED=false

# Leave CLOUDFLARE_TUNNEL_TOKEN blank for zero-config Quick Tunnel (*.trycloudflare.com)
CLOUDFLARE_TUNNEL_TOKEN=
# If using a Named Tunnel token, uncomment the command below:
# CLOUDFLARE_COMMAND="tunnel --no-autoupdate run"
EOF
fi

# Detect Docker
if command -v docker >/dev/null 2>&1; then
  echo "[+] Docker detected. Launching Adora stack (Navidrome + Hub + Cloudflare Tunnel)..."
  
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
  else
    echo "[-] docker-compose not found. Please install docker compose."
    exit 1
  fi

  $DOCKER_COMPOSE up -d --build

  echo "[+] Adora containers are starting up..."
  sleep 4

  echo "======================================================"
  echo "[*] Checking Cloudflare Tunnel status..."
  
  # Check if running Quick Tunnel or Named Tunnel
  if grep -q "CLOUDFLARE_TUNNEL_TOKEN=" .env && [ -z "$(grep '^CLOUDFLARE_TUNNEL_TOKEN=' .env | cut -d= -f2)" ]; then
    echo "[+] Mode: Cloudflare Quick Tunnel (Free, zero-config)"
    echo "[*] Retrieving public tunnel URL from logs..."
    sleep 3
    TUNNEL_URL=$(docker logs adora-tunnel 2>&1 | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)
    if [ -n "$TUNNEL_URL" ]; then
      echo ""
      echo "🎉 YOUR LIVE ADORA URL IS:"
      echo "👉  $TUNNEL_URL  👈"
      echo ""
      echo "You can paste this URL into your browser, or configure it as VITE_API_URL in the Adora app!"
    else
      echo "[*] Tunnel is still connecting. Run: docker logs -f adora-tunnel to see your live URL."
    fi
  else
    echo "[+] Mode: Cloudflare Named Tunnel active via CLOUDFLARE_TUNNEL_TOKEN."
  fi
  echo "======================================================"
  echo "Adora is live! To stop the server anytime, run:"
  echo "  $DOCKER_COMPOSE down"
else
  echo "[-] Docker is not currently installed on this system."
  echo ""
  echo "To run Adora locally without Docker using Node.js & standalone cloudflared:"
  echo "  1. Start the Adora Hub API:"
  echo "     cd server/hub && npm run build && npm start"
  echo "  2. In another terminal, run Cloudflare Tunnel:"
  echo "     curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared"
  echo "     chmod +x /tmp/cloudflared"
  echo "     /tmp/cloudflared tunnel --url http://localhost:8787"
  echo ""
  echo "This will immediately provide your free https://*.trycloudflare.com endpoint!"
fi
