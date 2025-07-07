#!/bin/bash

# 本番環境デプロイスクリプト（マイグレーション付き）
# このスクリプトは本番環境へのデプロイ時にマイグレーションも自動実行します

set -e  # エラーで停止

echo "🚀 本番環境へのデプロイを開始します..."

# 環境変数の確認
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ エラー: CLOUDFLARE_API_TOKEN が設定されていません"
    echo "環境変数を設定してください: export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

# 1. ビルド
echo "📦 アプリケーションをビルドしています..."
npm run build

# 2. マイグレーション状態の確認
echo "🔍 現在のマイグレーション状態を確認しています..."
wrangler d1 migrations list saifuu-db --remote

# 3. マイグレーションの適用
echo "🗄️  本番環境にマイグレーションを適用しています..."
npm run db:migrate:remote

# 4. マイグレーション結果の確認
echo "✅ マイグレーション適用後の状態を確認しています..."
wrangler d1 migrations list saifuu-db --remote

# 5. アプリケーションのデプロイ
echo "☁️  Cloudflare Workersにデプロイしています..."
npm run deploy:manual

echo "✨ デプロイが完了しました！"
echo "🌐 API URL: https://saifuu-api.ryosuke-horie37.workers.dev"
echo ""
echo "動作確認:"
echo "  curl https://saifuu-api.ryosuke-horie37.workers.dev/api/health"
echo "  curl https://saifuu-api.ryosuke-horie37.workers.dev/api/categories"