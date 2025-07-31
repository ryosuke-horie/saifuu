# Claude Review コメントトリガー機能

## 概要

Claude Code ReviewワークフローをPRコメントでの `@claude` メンションによってトリガーするように変更しました。これにより、開発者が意図的にレビューを求めたタイミングでのみレビューが実行され、以前のレビュー内容を考慮した効果的なレビューが可能になります。

## 主な変更点

### 1. トリガーの変更
- **変更前**: `pull_request` イベント（opened, synchronize）で自動実行
- **変更後**: `issue_comment` イベントで `@claude` メンションがある場合のみ実行

### 2. 実行条件
```yaml
if: |
  github.event.issue.pull_request &&
  contains(github.event.comment.body, '@claude')
```
- PRに関連するコメントであること
- コメント本文に `@claude` が含まれていること

### 3. レビュー履歴の考慮
- 同一PR内の過去のレビューコメントを自動取得
- Claude Code Actionによるコメントを識別し、履歴として保存
- レビュー時に過去の指摘内容を考慮し、重複を避ける

## 使用方法

### 基本的な使い方
1. PRのコメント欄で `@claude` をメンションしてコメントを投稿
2. Claude Code Reviewが自動的に起動し、PRの変更内容をレビュー
3. レビュー結果がインラインコメントとして投稿される

### コメント例
```
@claude レビューをお願いします
```

```
@claude この変更について確認してください
```

### 複数回のレビュー
- 同じPRで複数回 `@claude` をメンションすることで、追加レビューが可能
- 以前のレビュー内容は自動的に考慮され、重複した指摘は避けられる
- Sticky commentにより、レビュー結果は同一コメントで更新される

## 技術的詳細

### PR情報の取得
`issue_comment` イベントからPR情報を取得するため、GitHub CLIを使用してPRブランチ情報を取得：
```bash
gh pr view $PR_NUMBER --json headRefName,headRepository
```

### レビュー履歴の取得
1. PRのレビューコメント（`/pulls/{pr}/comments`）を取得
2. 通常のPRコメント（`/issues/{pr}/comments`）を取得
3. Claude関連のコメントを識別：
   - `user.type == "Bot"`
   - コメント本文に `"Claude Code Action"` を含む
   - Sticky commentマーカー `"<!-- claude-code-sticky-comment"` を含む

### 権限の変更
- `pull-requests: write` - レビューコメント作成のため
- `issues: write` - issue_commentイベントでのコメント作成のため

## メリット

1. **GitHub Actions使用時間の削減**
   - 必要な時のみレビューを実行
   - 不要な自動実行を防止

2. **開発者主導のレビュー**
   - レビューのタイミングを開発者が制御
   - 準備ができた時点でレビューを要求

3. **効果的なレビュー**
   - 過去のレビュー内容を考慮
   - 重複した指摘を避ける
   - 対応状況に応じた的確なフィードバック

4. **レビュー進捗の可視化**
   - 過去のレビュー履歴が自動的に考慮される
   - 対応済み/未対応の項目が明確に

## 注意事項

- `@claude` メンションは大文字小文字を区別しません
- PRコメント以外（Issueコメントなど）では実行されません
- レビュー履歴の取得に失敗した場合でも、通常のレビューは実行されます