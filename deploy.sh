eco "🏃🏻‍♀️해당 폴더로 이동 중..."
cd ../../Desktop/sieunnnn.github.io

eco "🗑️필요없는 파일 삭제 중..."
rm ./sieunnnn.github.io.iml

echo "⬆️ git add 중..."
git add .

echo "✍️ 커밋 메시지 입력 중..."
git commit -m "🚀 게시글 자동배포: $(date '+%Y-%m-%d %H:%M:%S')"

echo "🌍 GitHub로 푸시 중..."
git push origin main

echo "✅ 푸쉬 완료!"
