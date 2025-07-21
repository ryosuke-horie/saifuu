# E2Eテストガイド

## 概要

このドキュメントでは、SaifuuプロジェクトのE2E（End-to-End）テストの実装方法と運用方針について説明します。

## 基本方針

- **ローカル環境専用**: CI環境での実行は行わず、開発者のローカル環境でのみ実行
- **正常系のみ**: エラーハンドリングやパフォーマンステストは対象外
- **最小限のテスト**: 主要なユーザーフローのみをカバー
- **ブラウザ**: Chromeベースのテストのみサポート（Desktop Chrome、Mobile Chrome）

## 環境構成

### ディレクトリ構造
```
e2e/
├── package.json        # E2E専用の依存関係
├── playwright.config.ts # Playwright設定
└── tests/              # テストファイル
    └── expense.spec.ts # 支出管理機能のテスト
```

### 使用ツール
- **Playwright**: E2Eテストフレームワーク
- **TypeScript**: 型安全なテスト記述

## テスト実行方法

### 前提条件
1. 開発サーバーが起動していること
   ```bash
   # フロントエンド（別ターミナル）
   cd frontend && npm run dev
   
   # API（別ターミナル）
   cd api && npm run dev
   ```

2. データベースが初期化されていること
   ```bash
   cd api && npm run db:setup:dev
   ```

### テスト実行コマンド

```bash
cd e2e

# 全テスト実行
npm run test

# 特定のテストファイルを実行
npm run test -- expense.spec.ts

# UIモードで実行（デバッグ時に便利）
npm run test:ui

# ヘッドフルモード（ブラウザを表示）
npm run test -- --headed

# テスト結果レポートを表示
npm run test:report
```

### テストコード生成（Codegen）

Playwrightのコードジェネレーターを使用して、ブラウザ操作からテストコードを自動生成できます。

```bash
cd e2e

# 任意のURLで操作を記録
npm run codegen

# localhost:3000で操作を記録（開発環境用）
npm run codegen:localhost
```

## テスト実装のベストプラクティス

### 1. 一意なテストデータの使用

既存データの影響を受けないよう、タイムスタンプを使用した一意なデータを作成します。

```typescript
// タイムスタンプを使って一意なテストデータを作成
const timestamp = Date.now();
const testDescription = `[E2E_TEST] 動作確認 ${timestamp}`;
```

### 2. テスト専用プレフィックス

テストデータには `[E2E_TEST]` プレフィックスを付けて、通常のデータと区別します。

### 3. 要素の特定方法

```typescript
// 推奨: ロールベースのセレクタ
await page.getByRole('button', { name: '登録' });

// 推奨: ラベルベースのセレクタ
await page.getByLabel('カテゴリ');

// 一意なテキストで行を特定
const row = page.locator('tr', { hasText: testDescription });
```

### 4. 非同期処理の待機

```typescript
// フォームが閉じるのを待つ
await expect(page.getByRole('button', { name: '登録' })).not.toBeVisible();

// 要素が表示されるのを待つ
await expect(newRow).toBeVisible();
```

## 実装済みテスト

### 支出管理機能（expense.spec.ts）

1. **支出の新規登録**
   - ホーム画面から支出管理画面への遷移
   - フォームへの入力（金額、日付、説明、カテゴリ）
   - 登録後の表示確認

2. **支出の編集**
   - 登録済みデータの編集ボタンクリック
   - フォーム値の更新
   - 更新後の表示確認

3. **支出の削除**
   - 削除ボタンクリック
   - 確認ダイアログでの削除実行
   - 削除後の非表示確認

## トラブルシューティング

### テストが失敗する場合

1. **開発サーバーが起動しているか確認**
   ```bash
   # フロントエンドの確認
   curl http://localhost:3000
   
   # APIの確認
   curl http://localhost:5173/api/health
   ```

2. **ポート設定の確認**
   - フロントエンド: 3000（または3001）
   - API: 5173
   - `.env.local`の設定を確認

3. **既存データの影響**
   - テストデータには必ずタイムスタンプを含める
   - `[E2E_TEST]`プレフィックスを使用する

### デバッグ方法

1. **UIモードの活用**
   ```bash
   npm run test:ui
   ```

2. **スクリーンショット確認**
   - テスト失敗時に自動的に保存される
   - `test-results/`ディレクトリを確認

3. **ビデオ録画**
   - 失敗時のビデオが保存される
   - 操作の流れを確認可能

## 今後の改善案

### 短期
- [ ] 他の機能（サブスクリプション管理など）のテスト追加
- [ ] テストデータのクリーンアップ処理

### 中長期
- [ ] E2E専用環境の構築（データベース分離）
- [ ] CI/CD環境での実行（コスト最適化後）
- [ ] Visual Regression Testingの導入

## 関連ドキュメント

- [テストガイド](./テストガイド.md) - プロジェクト全体のテスト戦略
- [開発環境セットアップ](../開発環境/環境変数設定ガイド.md) - 環境構築手順