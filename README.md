# saifuu

完全個人用の家計管理アプリケーション

## 機能

- 支出/収入を登録/編集/一覧するインターフェース
- 支出/収入を中心にデータベースに保存
- サブスクの管理

## 開発環境セットアップ

### 前提条件
- Node.js 22（miseで管理）
- npm

### 初回セットアップ
```bash
# mise経由でNode.js 22をインストール
mise install

# 依存関係のインストール
npm install

# APIの依存関係もインストール
cd api && npm install
```

## 開発サーバーの起動

### 通常の開発作業
```bash
# ターミナル1: フロントエンド
npm run dev  # http://localhost:3000

# ターミナル2: API
cd api && npm run dev  # http://localhost:5173
```

## E2Eテストの実行

E2Eテストは開発環境と異なるポートを使用するため、開発作業と並行して実行できます。

### ポート構成
- **開発環境**
  - フロントエンド: `http://localhost:3000`
  - API: `http://localhost:5173`
- **E2Eテスト環境**
  - フロントエンド: `http://localhost:3002`
  - API: `http://localhost:3003`

### 自動実行（推奨）
```bash
cd frontend
npm run test:e2e
```
このコマンドで以下が自動的に実行されます：
1. フロントエンドサーバー起動（ポート3002）
2. APIサーバー起動（ポート3003）
3. Playwrightテスト実行

### 手動実行（デバッグ用）

開発中にサーバーを手動で起動してデバッグする場合：

```bash
# ターミナル1: APIサーバー（E2E用）
cd api
npm run dev:e2e  # http://localhost:3003

# ターミナル2: フロントエンドサーバー（E2E用）
cd frontend
npm run dev:e2e  # http://localhost:3002

# ターミナル3: E2Eテスト実行
cd frontend
npm run test:e2e
```

### E2Eテストのデバッグ

#### UIモードで実行（推奨）
```bash
npm run test:e2e:ui
```
ブラウザベースのUIでテストをステップ実行できます。

#### テスト結果レポートの確認
```bash
npm run test:e2e:report
```
最後のテスト実行結果をブラウザで確認できます。

### トラブルシューティング

#### テストが失敗する場合
1. 両方のサーバーが起動しているか確認
   ```bash
   # APIヘルスチェック
   curl http://localhost:3003/api/health
   ```

2. テスト用データベースをリセット
   ```bash
   cd api
   rm e2e-test.db
   ```

3. ポートが使用中の場合
   ```bash
   # 使用中のポートを確認
   lsof -i :3002
   lsof -i :3003
   
   # プロセスを終了
   kill -9 <PID>
   ```

### 注意事項
- E2Eテストは現在GitHub Actions（CI）では実行されません（無料枠節約のため）
- ローカル環境でのみ実行してください
- テスト用データベース（`api/e2e-test.db`）は自動的に作成されます

## その他のコマンド

### コード品質チェック
```bash
# 型チェック、リント、ユニットテスト
npm run check:fix

# APIも同様
cd api && npm run check:fix
```

### Storybook
```bash
# 開発モード
npm run storybook

# ビルド
npm run build-storybook
```
