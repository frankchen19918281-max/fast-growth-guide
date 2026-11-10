#!/bin/zsh
cd "$(dirname "$0")" || exit 1

PORT=4280
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

OLD_PIDS=$(lsof -iTCP:"${PORT}" -sTCP:LISTEN -t 2>/dev/null)
if [ -n "$OLD_PIDS" ]; then
  kill $OLD_PIDS 2>/dev/null
  sleep 1
fi

echo "========================================================"
echo "🏰 「快速成长指南 · 认知持仓簿」已启动！"
echo "--------------------------------------------------------"
echo "💻 电脑浏览器访问: http://localhost:${PORT}"
echo "📱 手机局域网访问: http://${LAN_IP}:${PORT}"
echo "   (手机与电脑连同一 Wi-Fi，用 Safari 打开上方地址，"
echo "    点击「分享 -> 添加到主屏幕」即可像小程序一样使用)"
echo "========================================================"

(sleep 1 && open "http://localhost:${PORT}") &
python3 -m http.server "${PORT}" --bind 0.0.0.0
