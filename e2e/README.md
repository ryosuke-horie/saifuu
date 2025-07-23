# E2Eテストディレクトリ構成

## 概要

E2Eテストを環境・目的別に分割し、効率的なテスト実行と開発支援を実現します。

## ディレクトリ構成

```
e2e/
├── production/                         # 本番環境向けテスト
│   ├── smoke-tests/                   # スモークテスト
│   │   └── homepage.spec.ts          # ホームページ基本確認
│   └── critical-flows/               # ビジネスクリティカルフロー
│       └── subscription-basic.spec.ts # サブスクリプション基本動作
├── development/                       # 開発環境向けテスト
│   ├── integration/                  # 統合テスト
│   │   └── subscription-full.spec.ts # 完全サブスクリプションフロー
│   └── components/                   # コンポーネントレベルテスト（将来拡張用）
├── configs/                          # 設定ファイル
│   ├── shared.config.ts             # 共通設定
│   ├── production.config.ts         # 本番環境設定
│   └── development.config.ts        # 開発環境設定
└── README.md                        # このファイル
```

## テスト分類

### 本番環境テスト (`production/`)

**目的**: 本番環境での正常動作確認
**特徴**:
- 高速実行（30秒以内/テスト）
- 最小限のUI確認
- 外部依存を避けた軽量テスト
- 既存サーバーの再利用

**実行方法**:
```bash
# 本番環境テスト実行
pnpm run test:e2e:production

# UI付き実行
pnpm run test:e2e:production:ui
```

### 開発環境テスト (`development/`)

**目的**: AI開発支援と詳細な統合テスト
**特徴**:
- 完全なAPI・DB統合テスト
- 詳細なログ・トレース
- データベース操作を含む包括的検証
- AI が開発の根拠として利用可能

**実行方法**:
```bash
# 開発環境テスト実行
pnpm run test:e2e:development

# UI付き実行
pnpm run test:e2e:development:ui
```

## 設定ファイル

### `shared.config.ts`
- 両環境で共通する基本設定
- Chrome専用設定
- スクリーンショット・ビデオ設定

### `production.config.ts`
- 高速実行重視
- 短いタイムアウト（30秒）
- 簡潔なレポート
- 既存サーバー再利用

### `development.config.ts`
- 包括的テスト設定
- 長いタイムアウト（2分）
- 詳細なレポート・ログ
- モバイルテスト含む

## 移行前後の比較

### 移行前
```
frontend/tests/e2e/
├── homepage.spec.ts      # 混在
└── subscriptions.spec.ts # 混在
```

### 移行後
```
e2e/
├── production/           # 本番確認用（高速）
└── development/          # 開発支援用（詳細）
```

## 利用ガイドライン

### 本番環境テスト
- CI/CDパイプラインでの継続実行
- 本番デプロイ前の最終確認
- サイト可用性の監視

### 開発環境テスト
- 新機能開発時の動作確認
- AIによる機能理解の参考資料
- バグ調査時の詳細検証

## 今後の拡張

- `development/components/` でのコンポーネント固有テスト
- パフォーマンステストの追加
- 視覚的回帰テストとの統合