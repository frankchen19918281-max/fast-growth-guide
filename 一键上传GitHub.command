#!/bin/zsh
cd "$(dirname "$0")" || exit 1

echo "========================================================"
echo "🚀 「快速成长指南」一键上传 GitHub Pages 向导"
echo "========================================================"
echo ""
echo "如果还没有在 GitHub 创建仓库，请先在浏览器打开："
echo "👉 https://github.com/new"
echo "创建一个公开 (Public) 仓库，例如命名为：fast-growth-guide"
echo ""
printf "请输入你的 GitHub 仓库地址 (例如 https://github.com/你的用户名/fast-growth-guide.git): "
read REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "❌ 未输入仓库地址，已取消。"
  exit 1
fi

git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git add .
git commit -m "chore: 更新快速成长指南" 2>/dev/null

echo ""
echo "正在推送到 GitHub (如弹出登录框或提示输入密码，请输入你的 GitHub 账号与 Token)..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 推送成功！"
  echo "最后一步开启手机公网访问："
  echo "1. 打开你的 GitHub 仓库页面 -> 点击顶部 Settings -> 左侧 Pages"
  echo "2. 在 Build and deployment 下，Branch 选择 main -> 点击 Save"
  echo "3. 等待约 1 分钟，即可在手机随时随地打开你的专属网址！"
else
  echo ""
  echo "⚠️ 推送未完成，请检查仓库地址或 GitHub 登录凭证是否正确。"
fi

read -k1 -s "?按任意键关闭窗口..."
