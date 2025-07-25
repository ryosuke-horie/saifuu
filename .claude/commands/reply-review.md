---
description: インラインレビューコメントを確認し、修正後に各コメントへ返信します
argument-hint: <owner> <repo> <pull_number>
---

# インラインレビューコメントの対応と返信

## 目的
プルリクエストのインラインレビューコメントを以下の手順で対応します：
1. **各コメントを一つずつ確認** - 未解決のコメントを特定
2. **修正をプランして実装** - コメント内容に基づいた修正
3. **各コメントに直接返信** - 対応内容を記載してインラインで返信

## コンテキスト
以下の MCP ツールと GitHub API を使用します：
- MCP: `get_pull_request_comments` - レビューコメント一覧の取得
- GraphQL: レビューコメントのリゾルブ状態確認
- REST API: `POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies` - コメントへの返信

GitHub CLI での返信実装：
```bash
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies \
  -f body='{reply_text}'
```

リゾルブ状態の確認（GraphQL）：
```graphql
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              id
              body
            }
          }
        }
      }
    }
  }
}
```

## 実行内容

引数で指定された PR について、以下を実行してください：

1. **MCP ツールの `get_pull_request_comments` でレビューコメント一覧を取得**
2. **GraphQL API でリゾルブ状態を確認し、未解決のコメントのみをフィルタリング**
3. **未解決の各コメントを以下の形式で表示：**
   ```
   === コメント #1 ===
   ファイル: src/main.js (L45)
   レビュアー: @reviewer1
   内容: "エラーハンドリングを追加してください"
   コメントID: 123456789
   状態: 未解決
   ```

4. **各未解決コメントに対して：**
   - 該当ファイルを開いて修正を実施
   - 修正が完了したら、GitHub API を使用してコメントに返信
   - 返信例: "ご指摘ありがとうございます。エラーハンドリングを追加しました。"

5. **すべての修正が完了したら：**
   - プロジェクトのリント、タイプチェック、テストを実行
     - CLAUDE.md に記載されているコマンドを使用
     - または package.json の scripts を確認（`npm run lint`, `npm run typecheck`, `npm run test`）
     - または Makefile のターゲットを確認
   - すべてパスすることを確認（失敗したらエラーを表示して中断）

6. **修正内容をコミット：**
   ```bash
   git add -u
   git commit -m "fix: レビューコメント対応

   - ファイル名:行番号 - 対応内容の要約
   - ファイル名:行番号 - 対応内容の要約
   ..."
   ```

7. **リモートリポジトリへプッシュ：**
   ```bash
   git push origin HEAD
   ```

## リフォーカス：実行の要点

このコマンドの核心は以下の3点です：

1. **インラインレビューコメントへの個別対応**
   - 各コメントを一つずつ確認し、必要な修正を実施
   - コメント内容を理解し、適切な修正をプラン

2. **GitHub API を使用した直接返信**
   - 修正完了後、各コメントに対して個別に返信
   - 対応内容を明確に記載してインラインで返信

3. **品質保証とコミット**
   - すべてのテスト・リント・型チェックをパス
   - 対応内容を整理してコミット・プッシュ

**重要**: コンテキストに記載されたAPIとツールを正確に使用し、一件ずつ丁寧に対応することが成功の鍵です。