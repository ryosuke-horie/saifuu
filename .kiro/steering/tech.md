# 技術スタック & ビルドシステム

## 主要技術

### フロントエンド
- **フレームワーク**: Next.js v15 with App Router
- **ランタイム**: React 19
- **スタイリング**: Tailwind CSS v4
- **言語**: TypeScript
- **デプロイ**: Cloudflare Workers via OpenNext

### API
- **フレームワーク**: Hono（軽量Webフレームワーク）
- **ランタイム**: Cloudflare Workers
- **データベース**: Cloudflare D1（SQLiteベース）
- **ORM**: Drizzle ORM
- **言語**: TypeScript

### 開発ツール
- **Node.js**: v22（miseで管理）
- **パッケージマネージャー**: npm
- **コード品質**: Biome（リント & フォーマット）
- **テスト**: Vitest（ユニット/統合）、Playwright（E2E）
- **コンポーネント開発**: Storybook
- **ビルドツール**: Vite（API）、Next.js（フロントエンド）
- **CI/CD**: GitHub Actions

## CI/CD & 品質管理

### GitHub Actions ワークフロー
- **静的解析**: TypeScript型チェック、Biomeリント、フォーマットチェック
- **テスト実行**: ユニットテスト、統合テスト（E2Eはローカルのみ）
- **ビルド検証**: フロントエンドとAPIの両方でビルド成功を確認
- **依存関係チェック**: セキュリティ脆弱性スキャン
- **自動デプロイ**: mainブランチへのマージ時に本番環境へ自動デプロイ

### 品質チェック項目
- **型安全性**: TypeScript strict mode での型チェック
- **コードスタイル**: Biome による統一されたフォーマット
- **テストカバレッジ**: ユニットテストでの適切なカバレッジ維持
- **パフォーマンス**: Next.js ビルド時のバンドルサイズチェック

## テスト設計

### テスト戦略（砂時計型アプローチ）
- **ユニットテスト**: APIとフロントエンドの複雑なロジック部分を重点的にカバー
  - オーバーテストやライブラリ自体のテストは避ける
  - ビジネスロジックと複雑な関数に集中
  - 適切なカバレッジを維持しつつ、意味のあるテストを実装
- **統合テスト**: APIエンドポイントとデータベースの連携を網羅的にテスト
  - エンドポイント単位での動作確認
  - データベース操作の整合性検証
  - 全体システムの動作を統合テストで幅広くカバー
- **E2Eテスト**: 最小限の重要ワークフローのみ（ローカル環境限定）
  - よく利用するユーザーフローに絞って実装
  - 異常系ケースは基本的に考慮しない
  - 正常系の主要なシステムフローをなぞる程度

### フロントエンド固有の方針
- **スモークテスト**: 実装しない方針
- **コンポーネントテスト**: 複雑なロジックを持つコンポーネントのみ

### テスト環境
- **開発環境**: SQLite（dev.db）
- **テスト環境**: インメモリSQLite
- **E2E環境**: 専用ポート（3002, 3003）での分離実行

### テストデータ管理
- **シードデータ**: 開発・テスト用の初期データ（drizzle/seed.sql）
- **テストフィクスチャ**: Faker.js による動的テストデータ生成
- **データベースリセット**: テスト間での状態クリーンアップ

### テスト品質の継続的改善
- テスト設計は開発過程で継続的に見直し・修正を行う
- 過度なテストや不要なテストは積極的にリファクタリング対象とする

## よく使うコマンド

### プロジェクトセットアップ
```bash
# mise経由でNode.js 22をインストール
mise install

# 依存関係のインストール（ルートとサブプロジェクト）
npm install
cd api && npm install
cd frontend && npm install

# 環境設定
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env

# データベースセットアップ
cd api && npm run db:setup:dev
```

### 開発
```bash
# 開発サーバーの起動
npm run dev                    # フロントエンド（ポート3000）
cd api && npm run dev         # API（ポート5173）

# コンポーネント開発
npm run storybook             # Storybook（ポート6006）
```

### テスト
```bash
# ユニットテスト
npm run test:unit             # フロントエンド
cd api && npm run test:unit   # API

# 統合テスト
cd api && npm run test:integration

# E2Eテスト
npm run test:e2e              # 自動E2E
npm run test:e2e:ui          # インタラクティブE2E
```

### コード品質
```bash
# 型チェック、リント、ユニットテスト
npm run check:fix             # フロントエンド
cd api && npm run check:fix   # API

# 個別コマンド
npm run typecheck
npm run lint:biome:fix
npm run format
```

### データベース管理
```bash
# 開発環境データベース
cd api && npm run db:migrate:dev    # マイグレーション適用
cd api && npm run db:studio:dev     # Drizzle Studio起動
cd api && npm run db:seed:dev       # シードデータ投入
cd api && npm run db:reset:dev      # データベースリセット

# 本番環境データベース（Cloudflare D1）
cd api && npm run db:migrate:remote # 本番環境に適用
cd api && npm run db:migrate:local  # ローカルD1に適用
```

### デプロイ
```bash
# APIデプロイ
cd api && npm run deploy

# フロントエンドデプロイ
cd frontend && npm run deploy

# 手動デプロイ（ビルド付き）
cd api && npm run deploy:manual
cd frontend && npm run deploy:manual
```

## ビルド設定

- **API**: Vite with Cloudflare plugin（Workers互換性のため）
- **フロントエンド**: Next.js with OpenNext（Cloudflare Workersデプロイ用）
- **データベース**: Drizzle Kit（スキーマ管理とマイグレーション）
- **環境**: mise（Node.jsバージョン管理、.mise.toml）