#!/usr/bin/env bash
# 发布脚本：自动测试、构建、打 tag、推送 GitHub/Gitee、发布 npm
# 用法：./scripts/release.sh [patch|minor|major|<具体版本号>]

set -euo pipefail

VERSION_ARG="${1:-patch}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 1. 前置检查
if [ -n "$(git status --porcelain)" ]; then
  echo "错误：工作区存在未提交更改，请先提交。"
  exit 1
fi

if ! command -v pnpm &>/dev/null; then
  echo "错误：未安装 pnpm。"
  exit 1
fi

# 2. 安装依赖并验证
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm test

# 3. 版本号提升
if [[ "$VERSION_ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  NEW_VERSION="$VERSION_ARG"
  npm version "$NEW_VERSION" --no-git-tag-version
else
  NEW_VERSION="$(npm version "$VERSION_ARG" --no-git-tag-version | sed 's/^v//')"
fi

echo "新版本: $NEW_VERSION"

# 4. 构建产物
pnpm build:lib

# 5. 提交版本变更
git add package.json pnpm-lock.yaml dist CHANGELOG.md 2>/dev/null || true
git commit -m "chore(release): v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# 6. 推送 GitHub（默认 origin）
echo "正在推送至 GitHub..."
git push origin HEAD

# 7. 推送 Gitee（可选，配置 remote 名为 gitee）
if git remote | grep -q "^gitee$"; then
  echo "正在推送至 Gitee..."
  git push gitee HEAD
else
  echo "未配置 gitee remote，跳过 Gitee 推送。"
fi

# 8. 发布 npm
echo "正在发布至 npm..."
pnpm publish --no-git-checks --access public

echo "发布完成: v$NEW_VERSION"
