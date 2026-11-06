#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "======================================================"
echo "    ADORA — Cloudflare Tunnel Local Runner            "
echo "    (Runs without Oracle Cloud — 100% Free)           "
echo "======================================================"

# Create persistent storage directories
mkdir -p "$DIR/data" "$DIR/music" "$DIR/bin"

# Check for .env file or create default
if [ ! -f "$DIR/.env" ]; then
  echo "[+] Initializing server/.env configuration..."
  cat << 'EOF' > "$DIR/.env"
# Adora Cloudflare Configuration
PORT=8787
ADMIN_JWT_SECRET=adora_secret_change_in_production_key_99
STORAGE_HIGH_WATERMARK_GB=160
STORAGE_TARGET_GB=140
TWO_FACTOR_ENABLED=false

# Leave CLOUDFLARE_TUNNEL_TOKEN blank for zero-config Quick Tunnel (*.trycloudflare.com)
CLOUDFLARE_TUNNEL_TOKEN=
EOF
fi

# Load environment
if [ -f "$DIR/.env" ]; then
  export $(grep -v '^#' "$DIR/.env" | xargs -d '\n' 2>/dev/null || true)
fi

# -------------------------------------------------------------
# MODE A: Docker / Docker Compose (if installed)
# -------------------------------------------------------------
if command -v docker >/dev/null 2>&1 && (docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1); then
  echo "[+] Docker detected. Launching Adora container stack..."
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
  else
    DOCKER_COMPOSE="docker-compose"
  fi

  $DOCKER_COMPOSE up -d --build

  echo "[+] Adora containers are starting up..."
  sleep 4

  echo "======================================================"
  echo "[*] Checking Cloudflare Tunnel status..."
  if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "[+] Mode: Cloudflare Quick Tunnel (Free, zero-config)"
    sleep 3
    TUNNEL_URL=$(docker logs adora-tunnel 2>&1 | grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)
    if [ -n "$TUNNEL_URL" ]; then
      echo ""
      echo "🎉 YOUR LIVE ADORA URL IS:"
      echo "👉  $TUNNEL_URL  👈"
      echo ""
      echo "You can open this URL in your browser, or set it as VITE_API_URL in the Adora app!"
    else
      echo "[*] Tunnel is still connecting. Run: docker logs -f adora-tunnel to see your live URL."
    fi
  else
    echo "[+] Mode: Cloudflare Named Tunnel active via CLOUDFLARE_TUNNEL_TOKEN."
  fi
  echo "======================================================"
  echo "Adora is live! To stop the server anytime, run:"
  echo "  $DOCKER_COMPOSE down"
  exit 0
fi

# -------------------------------------------------------------
# MODE B: Native Mode (Node.js + Standalone Cloudflared)
# -------------------------------------------------------------
echo "[*] Running Adora in Native Host Mode..."

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "[-] Node.js is required but not found in PATH."
  echo "    Please install Node.js (v18+) to run Adora."
  exit 1
fi
echo "[+] Node.js detected: $(node -v)"

# 2. Check / Download standalone cloudflared binary
CLOUDFLARED="$DIR/bin/cloudflared"
if [ ! -x "$CLOUDFLARED" ]; then
  if command -v cloudflared >/dev/null 2>&1; then
    CLOUDFLARED="$(command -v cloudflared)"
    echo "[+] Using system cloudflared: $CLOUDFLARED"
  else
    echo "[+] Downloading standalone cloudflared binary into server/bin/..."
    ARCH="$(uname -m)"
    case "$ARCH" in
      x86_64) CF_ARCH="amd64" ;;
      aarch64|arm64) CF_ARCH="arm64" ;;
      armv7l) CF_ARCH="arm" ;;
      *) CF_ARCH="amd64" ;;
    esac
    curl -fsSL -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" -o "$DIR/bin/cloudflared"
    chmod +x "$DIR/bin/cloudflared"
    echo "[+] cloudflared successfully installed to $CLOUDFLARED"
  fi
fi

# 2b. Check / Download standalone yt-dlp binary for JIT dynamic ingestion
YTDLP="$DIR/bin/yt-dlp"
if [ ! -x "$YTDLP" ]; then
  if command -v yt-dlp >/dev/null 2>&1; then
    YTDLP="$(command -v yt-dlp)"
    echo "[+] Using system yt-dlp: $YTDLP"
  else
    echo "[+] Downloading standalone yt-dlp binary into server/bin/..."
    curl -fsSL -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "$DIR/bin/yt-dlp"
    chmod +x "$DIR/bin/yt-dlp"
    echo "[+] yt-dlp successfully installed to $YTDLP"
  fi
fi
export YTDLP_PATH="$YTDLP"
export MUSIC_DIR="$DIR/music"

# 3. (Optional) Run Navidrome via Podman if available
if command -v podman >/dev/null 2>&1; then
  if ! podman ps --format "{{.Names}}" | grep -q "adora-navidrome"; then
    echo "[+] Podman detected. Starting Navidrome audio streaming server..."
    podman rm -f adora-navidrome 2>/dev/null || true
    podman run -d --name adora-navidrome \
      -p 4533:4533 \
      -v "$DIR/music:/music:rw" \
      -v "$DIR/data:/data:rw" \
      deluan/navidrome:latest >/dev/null 2>&1 || echo "[*] Navidrome container skipped."
  else
    echo "[+] Navidrome container is already running on port 4533."
  fi
fi

# 4. Build and Start Adora Hub
echo "[+] Building and launching Adora Hub API..."
cd "$DIR/hub"
if [ ! -d "node_modules" ]; then
  echo "[+] Installing hub dependencies..."
  npm install
fi
npm run build

# Process cleanup handler
cleanup() {
  echo ""
  echo "[*] Shutting down Adora Hub and Cloudflare Tunnel..."
  [ -n "$HUB_PID" ] && kill "$HUB_PID" 2>/dev/null || true
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  echo "[+] Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Adora Hub in background
PORT="${PORT:-8787}" YTDLP_PATH="$YTDLP" MUSIC_DIR="$DIR/music" node dist/index.js &
HUB_PID=$!
sleep 2

# 5. Start Cloudflare Tunnel
echo "[+] Establishing encrypted Cloudflare Tunnel to port 8787..."
CLOUDFLARED_LOG="$DIR/bin/cloudflared.log"
rm -f "$CLOUDFLARED_LOG"

if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  "$CLOUDFLARED" tunnel --no-autoupdate run --token "$CLOUDFLARE_TUNNEL_TOKEN" > "$CLOUDFLARED_LOG" 2>&1 &
  TUNNEL_PID=$!
  echo "[+] Cloudflare Named Tunnel active."
else
  "$CLOUDFLARED" tunnel --url "http://localhost:${PORT:-8787}" --no-autoupdate > "$CLOUDFLARED_LOG" 2>&1 &
  TUNNEL_PID=$!

  # Poll for Quick Tunnel URL
  TUNNEL_URL=""
  for i in {1..15}; do
    sleep 1
    if [ -f "$CLOUDFLARED_LOG" ]; then
      TUNNEL_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$CLOUDFLARED_LOG" | tail -n 1 || true)
      if [ -n "$TUNNEL_URL" ]; then
        break
      fi
    fi
  done

  echo ""
  echo "======================================================"
  if [ -n "$TUNNEL_URL" ]; then
    # Auto-sync app/.env with active live endpoint
    if [ -f "$DIR/../app/.env" ]; then
      sed -i "s|VITE_API_URL=.*|VITE_API_URL=$TUNNEL_URL|g" "$DIR/../app/.env"
      sed -i "s|VITE_WS_URL=.*|VITE_WS_URL=${TUNNEL_URL/https:\/\//wss:\/\/}|g" "$DIR/../app/.env"
      echo "[+] Auto-synced app/.env with active tunnel endpoint."
    fi
    echo "🎉 YOUR LIVE ADORA CLOUDFLARE URL IS:"
    echo ""
    echo "👉  $TUNNEL_URL  👈"
    echo ""
    echo "This URL is publicly accessible anywhere with SSL!"
    echo "Set VITE_API_URL=$TUNNEL_URL in the web/desktop app."
  else
    echo "[*] Tunnel is starting. Check: tail -f $CLOUDFLARED_LOG"
  fi
  echo "======================================================"
fi

echo "[*] Adora Hub and Cloudflare Tunnel are running."
echo "    Press [Ctrl + C] anytime to stop."
wait $HUB_PID
