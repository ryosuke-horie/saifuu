# PRコメント駆動CI実装ガイド

## 概要

本ドキュメントは、GitHub Issue #185で実装されたPRコメント駆動CI機能について説明します。

## 背景

従来のCI/CDパイプラインでは、PRで特定のディレクトリに変更があると自動的にCIが実行されていました。これにより、不要な場合でもセルフホストランナーのリソースを消費していました。

この問題を解決するため、PRコメントで明示的にCIを実行する仕組みを導入しました。

## 実装内容

### 1. コメント監視ワークフロー

`.github/workflows/comment-ci-trigger.yml` がPRコメントを監視し、特定のコマンドを検出してCIを実行します。

### 2. サポートされるコマンド

- `/ci api` - API関連のCIを実行
- `/ci frontend` - Frontend関連のCIを実行

複数のコマンドを同時に実行することも可能です：
```
/ci api
/ci frontend
```

### 3. 権限管理

現在の実装では権限管理は行っていません。誰でもPRにコメントすることでCIを実行できます。

## アーキテクチャ

```
PRコメント投稿
    ↓
comment-ci-trigger.yml 起動
    ↓
コメント内容をパース（parse-ci-comment.ts）
    ↓
有効なコマンドが見つかった場合
    ↓
対応するCIワークフローをworkflow_dispatchで起動
    ↓
結果をPRにフィードバックコメント
```

## 技術詳細

### コメントパーサー

`.github/scripts/parse-ci-comment.ts` がコメントを解析し、有効なCIコマンドを抽出します。

**入力例：**
```
修正しました。
/ci api
/ci frontend
よろしくお願いします。
```

**出力：**
```json
{
  "isValid": true,
  "targets": ["api", "frontend"]
}
```

### ワークフロートリガー

`.github/scripts/workflow-trigger.ts` がGitHub APIを使用してワークフローを起動します。

### CI/CDワークフローの変更

既存のCIワークフロー（`api-ci.yml`、`frontend-ci.yml`）は以下の変更を行いました：

1. `pull_request`イベントのトリガーを削除
2. `workflow_dispatch`イベントを追加（手動実行対応）
3. mainブランチへのpush時の自動実行は維持

## 使用方法

1. PRを作成または既存のPRを開く
2. コメント欄に `/ci api` または `/ci frontend` を入力
3. コメントを投稿
4. CIの実行状況がフィードバックコメントで通知される
5. 各CIの詳細はActionsタブで確認可能

## テスト

### ユニットテスト

`.github/scripts/__tests__/` ディレクトリに以下のテストを実装：

- `parse-ci-comment.test.ts` - コメントパーサーのテスト
- `workflow-trigger.test.ts` - ワークフロートリガーのテスト

テスト実行：
```bash
cd .github/scripts
npm test
```

### 統合テスト

実際のPR環境で以下の手順でテスト：

1. テスト用のPRを作成
2. 各種コマンドをコメント
3. CIが正しく実行されることを確認

## 今後の改善案

1. **権限管理の追加**
   - 特定のユーザーのみCIを実行できるようにする
   - GitHubのロールベース権限と連携

2. **コマンドの拡張**
   - `/ci all` - すべてのCIを実行
   - `/ci cancel` - 実行中のCIをキャンセル
   - `/ci status` - 現在のCI状況を確認

3. **通知の改善**
   - Slackなど外部サービスへの通知
   - より詳細な実行結果の表示

4. **パフォーマンス最適化**
   - 並列実行の最適化
   - キャッシュの活用

## トラブルシューティング

### CIが実行されない場合

1. コメントの形式が正しいか確認（`/ci api` または `/ci frontend`）
2. PRのステータスを確認（クローズされていないか）
3. GitHub Actionsのログを確認

### エラーが発生する場合

1. `.github/scripts/` の依存関係が正しくインストールされているか確認
2. ワークフローファイルの構文エラーを確認
3. GitHub APIの権限を確認

## 関連ファイル

- `.github/workflows/comment-ci-trigger.yml` - コメント監視ワークフロー
- `.github/workflows/api-ci.yml` - API CI設定
- `.github/workflows/frontend-ci.yml` - Frontend CI設定
- `.github/scripts/parse-ci-comment.ts` - コメントパーサー
- `.github/scripts/workflow-trigger.ts` - ワークフロートリガー
- `.github/scripts/__tests__/` - テストファイル