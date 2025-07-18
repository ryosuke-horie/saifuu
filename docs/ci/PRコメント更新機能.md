# CI/CD PRコメント更新機能

## 概要

GitHub ActionsのCIパイプラインがPull Requestにカバレッジレポートを投稿する際、既存のコメントを更新する機能を実装しました。これにより、CI実行のたびにコメントが連投される問題を解決します。

## 実装背景

### 問題点
- 従来は`gh pr comment`コマンドを使用していたが、このコマンドは新規コメントの作成のみをサポート
- CI実行のたびに新しいコメントが作成され、PRのコメント欄が煩雑になる
- 最新の情報がどれか分かりづらく、レビューの妨げになる

### 解決策
GitHub APIを直接使用し、コメントの識別子を用いて既存コメントの検索・更新を行う仕組みを実装

## 実装詳細

### 1. 共通スクリプト
`.github/scripts/update-pr-comment.js`
- Node.jsで実装されたGitHub API連携スクリプト
- コメント識別子を使用して既存コメントを検索
- 既存コメントが見つかれば更新、なければ新規作成
- エラー時のフォールバック機能付き

### 2. コメント識別子
- APIカバレッジ: `<!-- API_COVERAGE_REPORT -->`
- Frontendカバレッジ: `<!-- FRONTEND_COVERAGE_REPORT -->`
- HTMLコメントとして埋め込まれるため、ユーザーには表示されない

### 3. ワークフローの変更

#### API CI (`.github/workflows/api-ci.yml`)
```yaml
# 変更前
gh pr comment ${{ github.event.pull_request.number }} --body-file coverage_comment.md

# 変更後
node .github/scripts/update-pr-comment.js "API_COVERAGE_REPORT" "$(cat coverage_comment.md)"
```

#### Frontend CI (`.github/workflows/frontend-ci.yml`)
```yaml
# 変更前
gh pr comment ${{ github.event.pull_request.number }} --body-file coverage_comment.md

# 変更後
node .github/scripts/update-pr-comment.js "FRONTEND_COVERAGE_REPORT" "$(cat coverage_comment.md)"
```

## 技術的詳細

### スクリプトの動作フロー
1. PR番号とリポジトリ情報を環境変数から取得
2. GitHub APIを使用してPRの既存コメントを取得
3. 識別子を含むコメントを検索
4. 見つかった場合：PATCH APIでコメントを更新
5. 見つからない場合：POST APIで新規コメントを作成
6. エラー発生時：フォールバックとして新規作成を試行

### 必要な環境変数
- `GITHUB_TOKEN`: GitHub APIアクセス用トークン（GitHub Actionsで自動設定）
- `GITHUB_REPOSITORY`: リポジトリ名（owner/repo形式）
- `GITHUB_EVENT_PATH`: イベントペイロードのパス

### エラーハンドリング
- API呼び出しの失敗に対するリトライ機能
- 更新が失敗した場合のフォールバック（新規作成）
- 詳細なエラーログ出力

## 運用上の注意点

### レート制限
- GitHub APIのレート制限に注意
- 現在の実装では、コメント取得と更新の2回のAPI呼び出し
- 大量のコメントがある場合は、ページネーションの実装が必要

### 権限
- `GITHUB_TOKEN`にはissues:writeの権限が必要
- GitHub Actionsのデフォルトトークンで十分

### 並行実行
- 複数のCIが同時実行される場合の競合状態は未対応
- 実用上は問題ないが、将来的には楽観的ロックの実装を検討

## 今後の改善案

### 1. 統合コメント機能
複数のCIの結果を1つのコメントに統合する機能の実装：
- APIとFrontendのカバレッジを1つのコメントにまとめる
- ビルドステータスやテスト結果も含める
- より見やすいフォーマットの採用

### 2. カスタマイズ可能な識別子
プロジェクトごとに識別子をカスタマイズできる機能：
- 環境変数で識別子を指定可能に
- 複数の異なるレポートタイプに対応

### 3. レポート履歴機能
過去のカバレッジ推移を表示する機能：
- 前回との差分表示
- トレンドグラフの生成

## メンテナンス

### スクリプトの更新
1. `.github/scripts/update-pr-comment.js`を編集
2. テスト用PRで動作確認
3. 全てのワークフローで正常動作を確認

### トラブルシューティング
- コメントが更新されない場合：GitHub Actionsのログを確認
- 権限エラー：トークンの権限設定を確認
- API制限：実行頻度を調整

## 参考情報
- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues/comments)
- [GitHub Actions - Default environment variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables)