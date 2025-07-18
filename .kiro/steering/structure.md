# プロジェクト構造 & 組織

## リポジトリレイアウト

```
saifuu/
├── api/                    # バックエンドAPI（Hono + Cloudflare Workers）
├── frontend/              # フロントエンドアプリケーション（Next.js）
├── e2e/                   # エンドツーエンドテスト（Playwright）
├── docs/                  # プロジェクトドキュメント（日本語）
├── shared/                # 共有ユーティリティと設定
└── node_modules/          # ルート依存関係
```

## API構造（`api/`）

```
api/
├── src/
│   ├── routes/            # APIエンドポイントハンドラー
│   ├── db/                # データベーススキーマと設定
│   │   ├── schema.ts      # Drizzle ORMスキーマ定義
│   │   ├── index.ts       # データベース接続（開発環境）
│   │   └── index-d1.ts    # データベース接続（Cloudflare D1）
│   ├── middleware/        # リクエストミドルウェア（ロギング等）
│   ├── logger/            # ロギング実装
│   ├── types/             # TypeScript型定義
│   └── __tests__/         # テストファイル
│       ├── unit/          # ユニットテスト
│       ├── integration/   # 統合テスト
│       └── helpers/       # テストユーティリティ
├── drizzle/
│   ├── migrations/        # データベースマイグレーションファイル
│   └── seed.sql          # 初期データシード
├── scripts/               # ユーティリティスクリプト
├── public/                # 静的アセット
└── dist/                  # ビルド出力
```

## フロントエンド構造（`frontend/`）

```
frontend/
├── src/
│   ├── app/               # Next.js App Routerページ
│   │   ├── expenses/      # 支出管理ページ
│   │   ├── subscriptions/ # サブスクリプション管理ページ
│   │   ├── layout.tsx     # ルートレイアウト
│   │   └── page.tsx       # ホームページ
│   ├── components/        # Reactコンポーネント
│   │   ├── ui/            # ベースUIコンポーネント
│   │   ├── expenses/      # 支出専用コンポーネント
│   │   ├── subscriptions/ # サブスクリプション専用コンポーネント
│   │   └── layout/        # レイアウトコンポーネント
│   ├── hooks/             # カスタムReactフック
│   ├── lib/               # ユーティリティライブラリ
│   │   ├── api/           # APIクライアント関数
│   │   ├── logger/        # フロントエンドロギング
│   │   ├── utils/         # 汎用ユーティリティ
│   │   └── validation/    # フォームバリデーションスキーマ
│   ├── types/             # TypeScript型定義
│   ├── test-utils/        # テストユーティリティ
│   └── __tests__/         # テストファイル
├── .storybook/            # Storybook設定
├── public/                # 静的アセット
└── .next/                 # Next.jsビルド出力
```

## ドキュメント構造（`docs/`）

```
docs/
├── API開発/               # API開発ガイド
├── フロントエンド開発/     # フロントエンド開発ガイド
├── データベース/          # データベースドキュメント
├── ロギング/              # ロギング実装ドキュメント
├── テスト/                # テストガイド
├── 開発環境/              # 開発環境セットアップ
├── adr/                   # アーキテクチャ決定記録
└── ci/                    # CI/CDドキュメント
```

## テスト構造（`e2e/`）

```
e2e/
├── development/           # 開発環境テスト
├── production/            # 本番環境テスト
├── playwright-report/     # テストレポート
└── test-results/         # テスト成果物
```

## 主要な規約

### ファイル命名
- **コンポーネント**: PascalCase（例：`ExpenseForm.tsx`）
- **フック**: camelCase with `use`プレフィックス（例：`useExpenses.ts`）
- **ユーティリティ**: camelCase（例：`formatCurrency.ts`）
- **型**: PascalCase（例：`Expense.ts`）
- **テスト**: ソースファイルと同名で`.test.ts`サフィックス

### ディレクトリ組織
- **機能ベース**: 機能/ドメインごとに関連ファイルをグループ化
- **共有ユーティリティ**: `lib/`または`utils/`ディレクトリに配置
- **テスト併置**: 可能な限りソースファイルと同じ場所にテストを配置
- **型定義**: `types/`ディレクトリに集約

### インポート規約
- **絶対インポート**: srcディレクトリインポートには`@/`プレフィックスを使用
- **インデックスファイル**: ディレクトリからパブリックAPIをエクスポート
- **型インポート**: 型のみのインポートには`import type`を使用

### 環境固有ファイル
- **開発環境**: `.env`、`dev.db`、開発設定
- **本番環境**: Cloudflare Workers/Pages設定
- **テスト**: 別途テスト用データベースと設定

## 設定ファイル

### ルートレベル
- `package.json` - ルートプロジェクトメタデータ
- `.mise.toml` - Node.jsバージョン管理
- `.gitignore` - Git無視パターン

### API設定
- `wrangler.jsonc` - Cloudflare Workers設定
- `vite.config.ts` - ビルド設定
- `drizzle.config.ts` - データベースORM設定
- `vitest.config.ts` - テスト設定

### フロントエンド設定
- `next.config.ts` - Next.js設定
- `tailwind.config.js` - スタイリング設定
- `tsconfig.json` - TypeScript設定
- `.storybook/` - コンポーネント開発環境