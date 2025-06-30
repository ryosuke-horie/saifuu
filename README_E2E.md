# E2Eテスト実行ガイド

## ポート構成

開発環境とE2Eテスト環境を分離して、同時に起動できるようになっています。

### 開発環境
- フロントエンド: `http://localhost:3000` (Next.js)
- API: `http://localhost:5173` (Hono + Vite)

### E2Eテスト環境
- フロントエンド: `http://localhost:3002` (Next.js)
- API: `http://localhost:3003` (Hono + Vite)

## E2Eテストの実行

### 自動実行（推奨）
```bash
cd frontend
npm run test:e2e
```
このコマンドで以下が自動的に実行されます：
1. フロントエンドサーバー起動（ポート3002）
2. APIサーバー起動（ポート3003、ローカルSQLite使用）
3. E2Eテスト実行

### 手動実行（デバッグ用）

#### 1. APIサーバー起動
```bash
cd api
npm run dev:e2e
```
- ポート3003で起動
- ローカルSQLiteデータベース（`e2e-test.db`）使用
- デフォルトカテゴリが自動作成される

#### 2. フロントエンドサーバー起動
```bash
cd frontend
npm run dev:e2e
```
- ポート3002で起動
- APIは`http://localhost:3003/api`に接続

#### 3. E2Eテスト実行
```bash
cd frontend
npm run test:e2e
```

## 環境分離の利点

- 開発作業とE2Eテストを同時に実行可能
- ポート競合の心配なし
- テスト用データベースと開発用データベースの分離

## トラブルシューティング

### テストが失敗する場合
1. 両方のサーバーが起動しているか確認
2. `api/e2e-test.db`を削除して初期状態にリセット
3. ブラウザで直接アクセスして動作確認：
   - フロントエンド: `http://localhost:3002`
   - APIヘルスチェック: `http://localhost:3003/api/health`

### ポートが使用中の場合
```bash
# 使用中のポートを確認
lsof -i :3002
lsof -i :3003

# プロセスを終了
kill -9 <PID>
```