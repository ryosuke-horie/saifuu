# API テストドキュメント

このディレクトリには、Saifuu API プロジェクトの Cloudflare Workers 環境用テストファイルが含まれています。

## テストファイル構成

### 1. `setup.ts`
- テスト共通のセットアップとユーティリティ関数
- モックデータの定義
- データベースのテスト用ヘルパー関数

### 2. `types.d.ts`
- Cloudflare Workers テスト環境の型定義
- `cloudflare:test` モジュールの型宣言
- Vitest グローバル関数の型定義

### 3. `basic-integration.test.ts` ⭐ **推奨開始点**
- 基本的な統合テスト
- HTTP エンドポイントの動作確認
- Cloudflare Workers ランタイムの基本機能検証
- **実際に動作するテストファイル**

### 4. `health.test.ts`
- ヘルスチェックエンドポイント (`/api/health`) のテスト
- データベース接続確認
- レスポンス形式の検証

### 5. `categories.test.ts`
- カテゴリAPI (`/api/categories`) の CRUD 操作テスト
- GET, POST, PUT, DELETE の各エンドポイント
- バリデーションとエラーハンドリング

### 6. `workers-runtime.test.ts`
- Cloudflare Workers 特有の機能テスト
- ランタイム環境の検証
- Hono フレームワークとの統合確認

### 7. `database-integration.test.ts`
- D1 データベースとの統合テスト
- Drizzle ORM の動作確認
- データベース CRUD 操作の包括的テスト

## テスト実行方法

### 基本的な統合テストの実行（推奨）
```bash
npm run test:unit -- src/__tests__/basic-integration.test.ts
```

### すべてのテストファイルの実行
```bash
npm run test:unit
```

### 特定のテストファイルの実行
```bash
npm run test:unit -- src/__tests__/<test-file-name>.test.ts
```

### テスト監視モード
```bash
npm run test:watch
```

## 技術的な詳細

### Cloudflare Workers Test Environment
- `@cloudflare/vitest-pool-workers` を使用
- `SELF.fetch()` でアプリケーションへのリクエスト送信
- `SELF.env` で環境変数（D1 データベースなど）へのアクセス

### データベーステスト
- D1 SQLite データベースを使用
- テスト実行前に自動的にテーブルをクリーンアップ
- Drizzle ORM を通じたデータ操作

### 注意事項
- D1 データベース接続がテスト環境で制限される場合があります
- `basic-integration.test.ts` は最も安定して動作します
- データベース依存のテストは環境により失敗する可能性があります

## テストデータ

### モックカテゴリ
- 収入カテゴリ: "テスト収入カテゴリ" (緑色)
- 支出カテゴリ: "テスト支出カテゴリ" (赤色)

### モック取引
- 給与: 50,000円 (収入)
- 昼食代: 3,000円 (支出)

### モックサブスクリプション
- テストサブスク: 1,000円/月

## トラブルシューティング

### よくあるエラー
1. **"The RPC receiver does not implement the method 'env'"**
   - D1 データベース接続の問題
   - テスト環境では正常（警告として表示）

2. **"Invalid URL: /api/..."**
   - フルURL（`http://localhost/...`）を使用してください

3. **型エラー**
   - `types.d.ts` ファイルが正しく参照されているか確認

### デバッグ
- `console.log()` でデバッグ情報を出力可能
- Vitest の `--reporter=verbose` オプションで詳細表示

## 開発者向けガイド

### 新しいテストファイルの作成
1. ファイル上部に `/// <reference path="./types.d.ts" />` を追加
2. `import { SELF } from 'cloudflare:test'` でテスト環境にアクセス
3. HTTP リクエストは `http://localhost/` から始まるフル URL を使用

### テストパターン
- **単体テスト**: ビジネスロジックの検証
- **統合テスト**: API エンドポイントの動作確認
- **ランタイムテスト**: Cloudflare Workers 環境の機能確認

### ベストプラクティス
- テストは独立して実行可能にする
- データベースのクリーンアップを適切に行う
- エラーケースも包括的にテストする
- パフォーマンステストで応答時間を確認