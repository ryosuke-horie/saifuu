# saifuu

完全個人用の家計管理アプリケーション。支出・収入の記録と分析、サブスクリプション管理を行うWebアプリケーション。

## クイックスタート

### 前提条件
- Node.js 22（miseで管理）
- pnpm

### 初回セットアップ
```bash
# Node.js 22をインストール
mise install

# 依存関係のインストール
pnpm install
cd api && pnpm install
cd frontend && pnpm install

# 環境変数ファイルの作成
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env

# データベースのセットアップ
cd api && pnpm run db:setup:dev
```

## 開発サーバーの起動

```bash
# フロントエンド（別ターミナル）
pnpm run dev  # http://localhost:3000

# API（別ターミナル）
cd api && pnpm run dev  # http://localhost:5173
```

## 基本的なコマンド

```bash
# コード品質チェック
pnpm run check:fix

# テスト実行
pnpm run test:unit          # ユニットテスト
pnpm run test:e2e          # E2Eテスト（ローカルのみ）

# ビルド
pnpm run build             # フロントエンド
cd api && pnpm run build   # API
```

## 詳細ドキュメント

プロジェクトの詳細情報は以下のドキュメントを参照してください：

- 📌 **基本情報**
  - [プロジェクト概要](./docs/プロジェクト概要.md) - 目的、機能、アーキテクチャ
  - [技術スタック](./docs/技術スタック.md) - 使用技術の詳細
  - [プロジェクト構造](./docs/プロジェクト構造.md) - ディレクトリ構成

- 🛠 **開発ガイド**
  - [開発ルール](./CLAUDE.md) - コーディング規約、TDD原則
  - [コマンドリファレンス](./docs/コマンドリファレンス.md) - 全コマンドの詳細
  - [環境変数設定](./docs/開発環境/環境変数設定ガイド.md) - 詳細な環境設定
  - [データベース管理](./docs/データベース/README.md) - マイグレーション、シード

- 🧪 **テスト**
  - [テストガイド](./docs/テスト/テストガイド.md) - テスト戦略、実行方法
  - [E2Eテスト詳細](./docs/テスト/テストガイド.md#e2eテストの実行) - E2Eテストの詳細手順

- 📚 **全ドキュメント一覧**: [docs/README.md](./docs/README.md)

## ライセンス

個人プロジェクトのため、ライセンスは設定されていません。