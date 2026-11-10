#!/bin/zsh
cd "$(dirname "$0")" || exit 1

echo "========================================================"
echo "🚀 正在将「快速成长指南」最新书库同步到 GitHub Pages..."
echo "========================================================"

git add .
git commit -m "chore: 更新快速成长指南书库与配置" 2>/dev/null
git push origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 同步成功！约 30~60 秒后手机端即可刷新看到最新内容："
  echo "👉 https://frankchen19918281-max.github.io/fast-growth-guide/"
else
  echo ""
  echo "⚠️ 推送遇到网络波动，请稍后重试。"
fi

read -k1 -s "?按任意键关闭窗口..."
