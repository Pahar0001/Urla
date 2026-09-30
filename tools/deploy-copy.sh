#!/bin/bash
# Копия сайта для выкладки в другую папку (например, в монорепозиторий хостинга):
# статика как есть, страницы пересобираются с noindex — предварительная версия не попадёт в поиск.
#   bash tools/deploy-copy.sh <папка назначения>
# Папка назначения очищается от всего, чего нет в сайте (--delete): указывайте только её саму.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?укажите папку назначения}"
mkdir -p "$DEST"
rsync -a --delete \
  --exclude '.git' --exclude '.claude' --exclude 'tools' --exclude '*.md' \
  --exclude '.gitignore' --exclude '.DS_Store' \
  "$SRC/" "$DEST/"
node "$SRC/tools/build.mjs" --out "$DEST" --noindex
echo "копия: $DEST"
