# ドキュメント検索ツール使用ガイド
<!-- tags: tools, search, documentation, guide, scripts -->

このドキュメントでは、Saifuuプロジェクトのタグベースドキュメント検索機能の使用方法について説明します。

## 概要

ドキュメント検索ツールは、プロジェクト内のMarkdownファイルに付与されたHTMLコメント形式のタグ（`<!-- tags: tag1, tag2, tag3 -->`）を使用して、効率的にドキュメントを検索するためのツールです。

## 基本的な使用方法

### コマンド形式

```bash
npm run docs:search [オプション] [タグ...]
```

### 基本的な検索例

```bash
# 単一タグで検索
npm run docs:search api

# 複数タグでAND検索（デフォルト）
npm run docs:search api testing

# 複数タグでOR検索
npm run docs:search api frontend --or

# タグオプション形式での検索
npm run docs:search --tag=api --tag=backend

# 詳細情報付きで検索
npm run docs:search frontend --verbose
```

## オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--tag=<タグ>` | 検索するタグを指定 | `--tag=api` |
| `--tag <タグ>` | 検索するタグを指定（別形式） | `--tag api` |
| `--and` | 複数タグでAND検索（デフォルト） | `api testing --and` |
| `--or` | 複数タグでOR検索 | `api frontend --or` |
| `--verbose`, `-v` | 詳細な情報とタグ一覧を表示 | `--verbose` |
| `--help`, `-h` | ヘルプメッセージを表示 | `--help` |

## 利用可能なタグ一覧

### 開発領域別
- **API・バックエンド**: `api`, `backend`, `hono`, `cloudflare`, `d1`, `database`, `logger`, `migration`
- **フロントエンド**: `frontend`, `react`, `nextjs`, `components`, `ui`
- **テスト**: `testing`, `unit-test`, `integration-test`, `e2e`, `vitest`, `playwright`, `coverage`

### 機能・技術別
- **ロギング**: `logging`, `logger`, `monitoring`, `api-logger`, `frontend-logger`
- **データベース**: `database`, `d1`, `migration`, `seed`
- **ツール**: `tools`, `ghost`, `background-process`, `development-tools`

### ドキュメント種別
- **アーキテクチャ**: `architecture`, `decision-record`, `adr`, `design`, `technical-decisions`
- **CI/CD**: `ci`, `cd`, `github-actions`, `automation`, `deployment`, `workflow`
- **仕様・要件**: `specification`, `requirements`, `feature-spec`, `homepage`
- **運用**: `debugging`, `production`, `troubleshooting`, `operations`

### 環境・セットアップ
- **環境**: `setup`, `environment`, `troubleshooting`, `seed`
- **ドキュメント**: `documentation`, `readme`, `index`, `guide`

## 実践的な検索例

### 1. API開発関連のドキュメントを探す
```bash
# API関連のすべてのドキュメント
npm run docs:search api

# API開発とテストの両方に関するドキュメント
npm run docs:search api testing --and

# データベース関連のAPI開発ドキュメント
npm run docs:search api database
```

### 2. フロントエンド開発関連を探す
```bash
# フロントエンド関連のすべてのドキュメント
npm run docs:search frontend

# React または Next.js に関するドキュメント
npm run docs:search react nextjs --or

# コンポーネントとテストの組み合わせ
npm run docs:search components testing
```

### 3. テスト関連ドキュメントを探す
```bash
# テスト全般
npm run docs:search testing

# E2Eテスト専用
npm run docs:search e2e

# ユニットテストまたは統合テスト
npm run docs:search unit-test integration-test --or
```

### 4. トラブルシューティング関連を探す
```bash
# トラブルシューティング関連
npm run docs:search troubleshooting

# 本番環境のデバッグ
npm run docs:search production debugging --and

# 開発環境のセットアップ問題
npm run docs:search setup environment troubleshooting
```

### 5. ツールやユーティリティを探す
```bash
# 開発ツール全般
npm run docs:search tools

# Ghostツール関連
npm run docs:search ghost

# CI/CD関連ツール
npm run docs:search ci tools --and
```

## 詳細情報の表示

`--verbose` または `-v` オプションを使用すると、以下の追加情報が表示されます：

- 各ファイルに付与されているタグの一覧
- プロジェクト全体の統計情報
- 利用可能なすべてのタグの一覧

```bash
npm run docs:search api --verbose
```

## 検索のコツ

### 1. 段階的な絞り込み
最初は広いタグで検索し、徐々に条件を絞り込みます：

```bash
# 1. まず広い範囲で検索
npm run docs:search frontend

# 2. 具体的な技術で絞り込み
npm run docs:search frontend react

# 3. さらに特定の領域で絞り込み
npm run docs:search frontend react testing
```

### 2. OR検索の活用
関連する複数のタグで幅広く検索したい場合：

```bash
# テスト関連の幅広い検索
npm run docs:search testing unit-test e2e vitest playwright --or

# 環境構築関連
npm run docs:search setup environment troubleshooting --or
```

### 3. ネガティブケースの確認
期待する結果が出ない場合：

```bash
# 全体統計とタグ一覧を確認
npm run docs:search --verbose

# 似たようなタグで検索してみる
npm run docs:search api backend --or
```

## タグ付与ルール（ドキュメント作成者向け）

新しいドキュメントを作成する際は、以下の形式でタグを付与してください：

```markdown
<!-- tags: category1, category2, specific-tech, document-type -->
```

### タグ付与のベストプラクティス

1. **汎用タグ + 具体的タグの組み合わせ**
   ```markdown
   <!-- tags: frontend, react, components, testing -->
   ```

2. **階層的なタグ付け**
   ```markdown
   <!-- tags: api, backend, hono, d1, database, migration -->
   ```

3. **ドキュメントタイプの明示**
   ```markdown
   <!-- tags: api, setup, guide, development -->
   ```

## トラブルシューティング

### 検索結果が見つからない場合

1. タグの表記を確認してください（小文字、ハイフン区切り）
2. `--verbose` オプションで利用可能なタグを確認
3. OR検索で関連タグを含めて検索
4. 部分マッチも考慮（例：`test` で `testing` にもマッチ）

### パフォーマンスが遅い場合

大量のファイルがある場合、検索に時間がかかることがあります。より具体的なタグで絞り込みを行うことを推奨します。

## 今後の拡張予定

- **フルテキスト検索**: タグだけでなく、ドキュメント内容での検索
- **インデックス機能**: 検索速度の向上
- **Web UI**: ブラウザベースの検索インターフェース
- **結果のソート**: 関連度や更新日時でのソート機能