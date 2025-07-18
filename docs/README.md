# Saifuu プロジェクトドキュメント
<!-- tags: saifuu, documentation, index, readme, architecture, development, testing, api, frontend, devops -->

このディレクトリには、Saifuuプロジェクトのすべての技術ドキュメントが含まれています。

## 📌 プロジェクト基本情報
<!-- tags: overview, architecture, stack, structure -->

- [プロジェクト概要](./プロジェクト概要.md) - Saifuuの目的、機能、アーキテクチャ
- [技術スタック](./技術スタック.md) - 使用技術の詳細と選定理由
- [プロジェクト構造](./プロジェクト構造.md) - ディレクトリ構成と命名規約

## 📚 開発環境
<!-- tags: setup, environment, troubleshooting, commands -->

- [コマンドリファレンス](./コマンドリファレンス.md) - すべてのコマンドの包括的なリファレンス
- [開発環境エラー修正プラン](./開発環境/開発環境エラー修正プラン.md) - 開発環境のトラブルシューティング
- [環境変数設定ガイド](./開発環境/環境変数設定ガイド.md) - 環境変数の設定方法
- [ghost使用ガイド](./開発環境/ghost使用ガイド.md) - バックグラウンドプロセス管理ツールの使用方法

## 🔌 API開発
<!-- tags: api, backend, hono, cloudflare, logger -->

- [API開発README](./API開発/README.md) - API開発の概要
- [APIセットアップ](./API開発/setup.md) - APIの初期設定
- [テスト環境セットアップ](./API開発/test-environment-setup.md) - APIテスト環境の構築
- [エンドポイント検証](./API開発/endpoint-verification.md) - APIエンドポイントの検証方法

## 🗄️ データベース
<!-- tags: database, d1, migration, seed, cloudflare -->

- [カテゴリマイグレーションガイド](./データベース/カテゴリマイグレーションガイド.md) - カテゴリ管理のマイグレーション手順
- [シード処理ガイド](./データベース/シード処理ガイド.md) - データベースシード処理の実装方法
- [D1マイグレーション戦略](./データベース/d1-migration-strategy.md) - Cloudflare D1へのマイグレーション戦略
- [D1マイグレーション成功](./データベース/d1-migration-success.md) - D1マイグレーションの成功事例

## 📊 ロギング
<!-- tags: logging, logger, monitoring, api-logger, frontend-logger -->

### APIロガー

- [設計](./ロギング/API/設計.md) - APIロガーの設計ドキュメント
- [実装計画](./ロギング/API/実装計画.md) - 実装計画書
- [使用方法ガイド](./ロギング/API/使用方法ガイド.md) - 使用方法
- [実装完了レポート](./ロギング/API/実装完了レポート.md) - 実装完了報告

### フロントエンドロガー

- [設計](./ロギング/フロントエンド/設計.md) - フロントエンドロガーの設計
- [実装計画](./ロギング/フロントエンド/実装計画.md) - 実装計画
- [テスト戦略](./ロギング/フロントエンド/テスト戦略.md) - フロントエンドロガーのテスト戦略
- [テスト実装リファレンス](./ロギング/フロントエンド/テスト実装リファレンス.md) - テスト実装のクイックリファレンス

## 🎨 フロントエンド開発
<!-- tags: frontend, react, nextjs, storybook, logger, components, ui -->

### Storybook

- [Storybook実装詳細](./storybook/実装詳細.md) - Storybookの実装詳細
- [Storybook使用方法ガイド](./storybook/使用方法ガイド.md) - Storybookの使い方


## 🧪 テスト
<!-- tags: testing, unit-test, integration-test, e2e, vitest, playwright, coverage -->

### 全般

- [テストガイド](./テスト/テストガイド.md) - テスト全般の方針とガイド
- [テストケース分析](./テスト/テストケース分析.md) - テストケースの分析結果


## 🏗 アーキテクチャ決定記録 (ADR)
<!-- tags: architecture, decision-record, adr, design, technical-decisions -->

- [ADR作成ガイド](./adr/ADR作成ガイド.md) - ADR作成時のガイドラインとチェックリスト
- [ADR-001: VRTシステムの削除](./adr/001-remove-vrt-system.md) - Visual Regression Testingシステムの削除決定
- [ADR-002: Reactロガー統合](./adr/002-react-logger-integration.md) - Reactロガーの統合方針

## 🚀 CI/CD
<!-- tags: ci, cd, github-actions, automation, deployment, workflow -->

- [PRコメント駆動CI実装ガイド](./ci/PRコメント駆動CI実装ガイド.md) - PRコメントを使用したCI/CDの実装
- [ドキュメントメンテナンスワークフロー](./ci/ドキュメントメンテナンスワークフロー.md) - mainへのマージ後に自動でドキュメントを更新するワークフロー

## 📋 仕様書・要件定義
<!-- tags: specification, requirements, documentation, feature-spec, homepage -->

- [ホームページ要件定義書](./ホームページ要件定義書.md) - ホームページ（ランディングページ）の要件定義
- [支出管理画面要件定義書](./支出管理画面要件定義書.md) - 支出管理機能の要件定義
- [react-logger-integration-spec](./react-logger-integration-spec.md) - Reactロガー統合の仕様

## 🐛 デバッグ・運用
<!-- tags: debugging, production, monitoring, troubleshooting, operations -->

- [本番環境デバッグメモ](./本番環境デバッグメモ.md) - 本番環境でのデバッグ記録

## 📝 アーカイブ
<!-- tags: archive, completed, historical, legacy -->

### 完了済みタスク

- [完了済みIssue-94](./完了済みIssue-94.md) - Issue #94の完了記録

> **注意**: 完了済みタスクは四半期ごとに `docs/archive/` ディレクトリへ移動されます

---

## 📖 ドキュメント管理
<!-- tags: documentation, management, policy, integration -->

- [ドキュメント統合方針](./ドキュメント統合方針.md) - ドキュメントの役割分担と統合戦略
- [ドキュメント統合実行計画](./ドキュメント統合実行計画.md) - 統合作業の詳細計画

## ドキュメント管理方針

- すべてのドキュメントは日本語ファイル名のMarkdownファイルとして作成
- 機能や目的に応じてサブディレクトリに分類
- 実装と同時にドキュメントを更新し、常に最新状態を保つ
- 重要な技術的選定を行った場合はADRとして記録

### ドキュメント検索性の向上

- 各セクションにHTMLコメント形式でタグを付与（例: `<!-- tags: api, backend, testing -->`）
- 将来的な検索機能の実装を見据えた構造化
- タグによる横断的なドキュメント検索の実現（実装予定）