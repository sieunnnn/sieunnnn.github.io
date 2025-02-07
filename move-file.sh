#!/bin/bash

echo "🔄 URL 수정 중..."
export LC_CTYPE=C
export LANG=C
find _site -type f -exec sed -i '' 's|https://sieunnnn.github.io|https://sieunnnn.github.io|g' {} +


echo "📂 배포 폴더로 이동 중..."
cp -r _site/* ../../Desktop/sieunnnn.github.io

echo "✅ 이동 완료!"
