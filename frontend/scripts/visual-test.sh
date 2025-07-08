#!/bin/bash

# Storybook Visual Testing Script
# このスクリプトはビジュアルテストを実行するためのヘルパーです

set -e

echo "🎨 Storybook Visual Testing Helper"
echo "=================================="

# 環境確認
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm が見つかりません"
    exit 1
fi

# パッケージの存在確認
if ! npm list storybook-addon-vis &> /dev/null; then
    echo "❌ Error: storybook-addon-vis がインストールされていません"
    echo "   npm install storybook-addon-vis を実行してください"
    exit 1
fi

# 使用方法の表示
show_usage() {
    echo "使用方法:"
    echo "  $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  start     - Storybookを起動（ポート6006）"
    echo "  test      - ビジュアルテスト専用ストーリーのみ表示"
    echo "  help      - このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 start           # Storybookサーバーを起動"
    echo "  $0 test            # ビジュアルテストモードで起動"
    echo ""
    echo "📝 Notes:"
    echo "  - ビジュアルテストのストーリーには 'visual-test' タグが付いています"
    echo "  - Storybookでタグフィルター機能を使用してビジュアルテストのみ表示可能"
    echo "  - 設定ファイル: .storybook/preview.ts"
    echo "  - ドキュメント: docs/Storybookビジュアルテスト設定ガイド.md"
}

# ビジュアルテスト対象ストーリーの一覧表示
show_visual_test_stories() {
    echo "🔍 ビジュアルテスト対象ストーリー:"
    echo ""
    
    # visual-testタグが付いているストーリーを検索
    find src -name "*.stories.tsx" -exec grep -l "visual-test" {} \; | while read file; do
        echo "📁 $file"
        grep -n "export const.*Story.*=" "$file" | grep -B5 -A5 "visual-test" | \
        grep "export const" | sed 's/^/   - /'
        echo ""
    done
}

# Storybookサーバーの起動
start_storybook() {
    echo "🚀 Storybookサーバーを起動しています..."
    echo ""
    echo "📌 ビジュアルテストの確認方法:"
    echo "   1. ブラウザで http://localhost:6006 を開く"
    echo "   2. サイドバーのフィルター機能で 'Tags: visual-test' を選択"
    echo "   3. ビジュアルテスト専用ストーリーが表示されます"
    echo ""
    
    npm run storybook
}

# メイン処理
case "${1:-help}" in
    "start")
        start_storybook
        ;;
    "test")
        show_visual_test_stories
        echo "ビジュアルテストを実行するには 'npm run storybook' でStorybookを起動してください"
        ;;
    "help"|*)
        show_usage
        ;;
esac