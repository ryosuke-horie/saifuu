# Knipデッドコード検知ガイド

## 概要

Knipは不要なコードや依存関係を自動検知するツールです。このプロジェクトでは、フロントエンド側のデッドコード検知環境を構築し、コードベースの品質向上と保守性の向上を実現します。

## 設定方針

### 保守的な設定による安全性の確保

必要なソースコードが誤って削除されることを防ぐため、以下の保守的な設定を採用しています：

- **警告レベル**: エラーではなく警告レベルで実行し、ビルドプロセスを中断しない
- **包括的な除外設定**: テストファイル、Storybookファイル、MSWモックファイルなどを適切に除外
- **フレームワーク依存関係の除外**: Next.js、React、開発ツールなどの依存関係を誤検知から除外

### 対象技術スタック

- **Next.js 15** - App Directory構造に対応
- **React 19** - コンポーネントとフック
- **TypeScript** - 型定義ファイル
- **Storybook** - ストーリーファイルとアドオン
- **Vitest** - テストファイルとユーティリティ
- **MSW** - モックサービスワーカー
- **Biome** - リント・フォーマットツール

## 使用方法

### 基本的な使用

```bash
# フロントエンドディレクトリで実行
cd frontend

# 標準的な分析
npm run knip

# 本番環境向けの厳密な分析
npm run knip:production

# 自動修正付きの分析
npm run knip:fix
```

### CI/CDでの使用

```bash
# 型チェック、リント、テスト、デッドコード検知を一括実行
npm run check:knip
```

## 設定詳細

### エントリーポイント設定

以下のファイルをエントリーポイントとして認識します：

#### Next.js関連
- `src/app/**/{page,layout,loading,error,not-found,global-error}.{js,jsx,ts,tsx}`
- `src/app/**/route.{js,ts}` - API routes
- `src/middleware.{js,ts}` - ミドルウェア
- `next.config.{js,ts}` - Next.js設定

#### Storybook関連
- `.storybook/main.{js,ts}` - Storybook設定
- `.storybook/preview.{js,ts}` - グローバル設定

#### テスト関連
- `vitest.config.{js,ts}` - テスト設定
- `vitest.setup.{js,ts}` - テストセットアップ

#### ビルド設定
- `postcss.config.{js,mjs}` - PostCSS設定
- `tailwind.config.{js,ts}` - Tailwind設定
- `open-next.config.{js,ts}` - OpenNext設定

### 除外設定

#### ファイル除外
- **テストファイル**: `src/**/*.{test,spec}.{js,jsx,ts,tsx}`
- **Storybookファイル**: `src/**/*.stories.{js,jsx,ts,tsx}`
- **MSWファイル**: `src/test-utils/**`、`public/mockServiceWorker.js`
- **ビルド成果物**: `.next/**`、`dist/**`、`build/**`
- **型定義ファイル**: `**/*.d.ts`

#### 依存関係除外
- **フレームワーク**: `next`、`@opennextjs/cloudflare`、`react`、`react-dom`
- **テストツール**: `@testing-library/*`、`vitest`、`@vitest/*`、`jsdom`
- **Storybook**: `@storybook/*`、`storybook`
- **MSW**: `msw`、`msw-storybook-addon`
- **開発ツール**: `@biomejs/biome`、`@playwright/test`、`wrangler`
- **ビルドツール**: `tailwindcss`、`@tailwindcss/postcss`、`@vitejs/plugin-react`
- **TypeScript**: `typescript`、`@types/*`
- **テストユーティリティ**: `@faker-js/faker`

## 実行結果の解釈

### 警告レベルでの実行

設定では全てのルールを警告レベルに設定しているため、以下の利点があります：

- **ビルドプロセスの中断なし**: CIでエラーが発生しない
- **段階的な改善**: 警告を確認し、段階的に不要なコードを削除可能
- **誤検知の確認**: 必要なコードが誤って検出された場合も安全

### 典型的な検知パターン

#### 未使用ファイル
```bash
# 例: 使用されていないユーティリティファイル
src/lib/utils/unused-helper.ts
```

#### 未使用エクスポート
```bash
# 例: エクスポートされているが使用されていない関数
src/lib/api/client.ts - export unusedFunction
```

#### 未使用依存関係
```bash
# 例: package.jsonに記載されているが使用されていない依存関係
lodash (package.json)
```

## 保守とメンテナンス

### 定期的な実行

以下のタイミングでKnipを実行することを推奨します：

1. **機能開発完了時**: 新機能開発後の不要コード確認
2. **リファクタリング後**: コード整理後の検証
3. **定期的なメンテナンス**: 月1回程度の定期実行
4. **PR作成前**: 重要な変更をPRに含める前

### 設定の更新

以下の場合、設定の更新が必要です：

1. **新しい技術スタックの追加**: 新しいライブラリやツールの追加時
2. **ビルドプロセスの変更**: webpack、Vite等のビルドツール変更時
3. **テストフレームワークの変更**: Jest、Vitest等のテスト環境変更時
4. **ディレクトリ構造の変更**: src構造やビルド出力先の変更時

### 設定ファイルの場所

- **設定ファイル**: `frontend/knip.json`
- **依存関係**: `frontend/package.json`
- **このドキュメント**: `docs/Knipデッドコード検知ガイド.md`

## トラブルシューティング

### よくある問題と解決方法

#### 1. 必要なファイルが未使用として検出される

**解決方法**: `knip.json`の`ignore`配列に追加

```json
{
  "ignore": [
    "src/path/to/necessary-file.ts"
  ]
}
```

#### 2. 必要な依存関係が未使用として検出される

**解決方法**: `knip.json`の`ignoreDependencies`配列に追加

```json
{
  "ignoreDependencies": [
    "necessary-dependency"
  ]
}
```

#### 3. 新しいNext.jsのファイル規則が認識されない

**解決方法**: `knip.json`の`entry`配列にパターンを追加

```json
{
  "entry": [
    "src/app/**/new-file-pattern.{js,ts}"
  ]
}
```

### パフォーマンスの最適化

大規模なプロジェクトでは以下の最適化を検討：

1. **除外パターンの最適化**: 不要なファイルのスキャンを避ける
2. **エントリーポイントの最適化**: 必要最小限のエントリーポイントに絞る
3. **並列実行**: 可能な場合は並列実行オプションを使用

## 関連ドキュメント

- [テストガイド](./テストガイド.md) - テストファイルの取り扱い
- [API開発ガイド](./API開発/README.md) - API関連のコード管理
- [Storybook使用方法ガイド](./storybook/使用方法ガイド.md) - Storybookファイルの管理

## 参考リンク

- [Knip公式ドキュメント](https://knip.dev/)
- [Next.jsとKnipの統合](https://knip.dev/guides/next-js)
- [TypeScriptプロジェクトでのKnip](https://knip.dev/guides/typescript)