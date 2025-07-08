# ビジュアルリグレッションテスト運用ガイド - GitHub Actions

## 概要

GitHub Actionsでのビジュアルリグレッションテストワークフローの運用ガイドです。`storybook-addon-vis`とVitestを使用した自動ビジュアルテストにより、UI変更の検出と品質保証を実現します。

## ワークフロー概要

### トリガー条件

ビジュアルテストワークフローは以下の条件で自動実行されます：

#### Pull Request
- `frontend/` ディレクトリ内のファイル変更
- `.storybook/` ディレクトリ内のファイル変更  
- `**/*.stories.*` パターンのストーリーファイル変更
- ワークフローファイル自体の変更

#### Push (main ブランチ)
- 上記と同じファイルパターンの変更

### ワークフロー構成

```yaml
名前: Visual Regression Tests (Self-hosted)
実行環境: セルフホストランナー
タイムアウト: 30分
並行実行制御: 同一PRでの複数実行時は前の実行をキャンセル
```

## 実行手順

### 1. ビジュアルテストの実行

```bash
# 手動でローカル実行する場合
cd frontend
npm run test:visual

# ベースライン更新（変更を意図的に反映）
npm run test:visual:update
```

### 2. GitHub Actions での自動実行

1. **PR作成/更新時**：自動でビジュアルテストが実行
2. **テスト結果確認**：PRコメントで結果を確認
3. **差分レビュー**：必要に応じてアーティファクトをダウンロード
4. **ベースライン更新**：変更が意図的な場合はローカルで更新

## 結果の確認方法

### PRコメントでの確認

ワークフローが完了すると、PRに以下の情報を含むコメントが投稿されます：

- **テスト結果**: ✅ PASSED / ❌ FAILED
- **差分画像数**: 検出された視覚的差分の数
- **新規ベースライン数**: 新しく作成されたベースライン画像の数
- **ワークフロー実行リンク**: 詳細確認用のリンク

### アーティファクトのダウンロード

差分が検出された場合、以下のアーティファクトがアップロードされます：

#### `visual-test-results-{run_number}`
- **保存期間**: 30日
- **内容**: 
  - `__vis__/**/*.png` - すべてのビジュアルテスト画像
  - `visual-test-summary.txt` - テスト結果サマリー

#### `visual-test-logs-{run_number}`
- **保存期間**: 7日  
- **内容**:
  - `test-results/**/*` - 詳細なテストログ
  - `storybook-static/**/*` - ビルドされたStorybook

### アーティファクトの確認手順

1. GitHub ActionsのWorkflow実行ページを開く
2. "Artifacts" セクションから該当ファイルをダウンロード
3. ZIPファイルを展開
4. `__vis__` フォルダ内の差分画像を確認

## ビジュアルテストの設定

### ストーリーでのビジュアルテスト有効化

ストーリーファイルでビジュアルテストを有効にするには、`tags` に `"visual-test"` を追加します：

```typescript
export const Default: Story = {
  args: {
    // ストーリーの設定
  },
  tags: ["visual-test"], // ビジュアルテスト対象
  parameters: {
    chromatic: { 
      delay: 300, // アニメーション完了待機
      diffThreshold: 0.1, // 差分許容値
      viewports: [320, 768, 1024], // 複数ビューポート
    },
  },
};
```

### レスポンシブテスト設定

複数の画面サイズでのテストが必要な場合：

```typescript
export const MobileView: Story = {
  tags: ["visual-test"],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    chromatic: {
      viewports: [320, 375], // モバイルサイズ
      delay: 300,
    },
  },
};
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. False Positive（不要な差分検出）

**原因**: フォントレンダリング、アニメーション、動的コンテンツ

**解決方法**:
```typescript
// アニメーション無効化
parameters: {
  chromatic: {
    delay: 500, // 待機時間を延長
    pauseAnimationAtEnd: true,
  },
}

// 動的要素のモック化
play: async ({ canvasElement }) => {
  // 固定値を設定
  const dateElement = within(canvasElement).getByTestId('current-date');
  dateElement.textContent = '2024-01-01';
}
```

#### 2. テスト実行時間の長時間化

**原因**: 多数のストーリー、重いコンポーネント

**対策**:
- ビジュアルテスト対象ストーリーの選別
- 不要な `"visual-test"` タグの除去
- テスト並列度の調整

#### 3. CI環境でのブラウザ起動失敗

**原因**: Chromiumの依存関係不足

**解決確認**:
```bash
# セルフホストランナーでの環境確認
cd frontend
npm run test:visual -- --run
```

### エラーパターン別対応

#### "No baseline found" エラー

```bash
# 初回実行時：ベースライン作成
npm run test:visual:update
git add __vis__/
git commit -m "feat: ビジュアルテストのベースライン追加"
```

#### "Visual difference detected" エラー

```bash
# 1. 差分を確認
npm run test:visual

# 2. 意図的な変更の場合：ベースライン更新
npm run test:visual:update

# 3. 変更をコミット
git add __vis__/
git commit -m "feat: UIデザイン変更に伴うビジュアルベースライン更新"
```

## ベストプラクティス

### 1. ストーリー設計

```typescript
// ✅ 良い例：安定したテストデータ
export const LoadingState: Story = {
  args: {
    data: mockStableData, // 固定のモックデータ
    isLoading: true,
  },
  tags: ["visual-test"],
  parameters: {
    chromatic: { delay: 300 },
  },
};

// ❌ 悪い例：不安定な要素
export const WithCurrentTime: Story = {
  args: {
    currentTime: new Date(), // 実行毎に変わる
  },
  tags: ["visual-test"], // 常に差分が発生する
};
```

### 2. テスト範囲の決定

**優先度高（必須テスト）**:
- 基本状態のコンポーネント
- エラー・成功状態
- モバイル・デスクトップ表示

**優先度中（選択的テスト）**:
- バリエーションの多いコンポーネント
- 複雑なレイアウト
- インタラクション後の状態

**優先度低（除外対象）**:
- アニメーション中の状態
- 外部API依存の動的コンテンツ
- 頻繁に変更される文言

### 3. 運用フロー

#### 開発者向け作業フロー

1. **新機能開発時**
   ```bash
   # 新しいコンポーネント作成
   # ストーリー作成（visual-testタグ追加）
   npm run test:visual:update # ベースライン作成
   git add __vis__/
   git commit -m "feat: 新コンポーネントのビジュアルベースライン追加"
   ```

2. **UI修正時**
   ```bash
   # UI変更実装
   npm run test:visual # 差分確認
   # 期待通りの変更の場合
   npm run test:visual:update # ベースライン更新
   git add __vis__/
   git commit -m "feat: UIデザイン修正に伴うビジュアルベースライン更新"
   ```

3. **PR作成時**
   - GitHub Actionsでの自動テスト実行
   - PRコメントで結果確認
   - 必要に応じてアーティファクトで詳細確認

#### レビュアー向けフロー

1. **PRレビュー時**
   - PRコメントのビジュアルテスト結果確認
   - 差分がある場合はアーティファクトダウンロード
   - 意図しない変更がないかチェック

2. **承認判断**
   - 差分が設計意図に沿っているか
   - 他コンポーネントへの影響がないか
   - アクセシビリティに問題がないか

## 設定カスタマイズ

### ワークフロー設定の調整

タイムアウト時間や並行実行制御を調整する場合：

```yaml
# .github/workflows/visual-tests.yml
jobs:
  visual-tests:
    timeout-minutes: 45 # 実行時間に応じて調整
    concurrency:
      group: visual-tests-${{ github.ref }}
      cancel-in-progress: true
```

### テスト対象の調整

特定のストーリーのみをテスト対象にする場合：

```typescript
// 特定の環境でのみビジュアルテスト実行
export const ProductionOnly: Story = {
  tags: process.env.NODE_ENV === 'production' ? ["visual-test"] : [],
  // ...
};
```

## パフォーマンス最適化

### 実行時間短縮のための設定

```yaml
# ワークフロー並列化
strategy:
  matrix:
    component-group: [ui, forms, navigation]
```

### リソース使用量の最適化

```typescript
// 軽量なテストケースに絞る
const VISUAL_TEST_COMPONENTS = [
  'Button', 'Dialog', 'Input', // 基本コンポーネントのみ
];

export const story = {
  tags: VISUAL_TEST_COMPONENTS.includes(componentName) 
    ? ["visual-test"] 
    : [],
};
```

## 関連ドキュメント

- [ビジュアルリグレッションテスト実装計画](./ビジュアルリグレッションテスト実装計画.md)
- [ビジュアルリグレッションテスト技術選定](./ビジュアルリグレッションテスト技術選定.md)
- [Storybook使用方法ガイド](./storybook/使用方法ガイド.md)

---

**作成日**: 2025年7月7日  
**更新日**: 2025年7月7日  
**対象Issue**: #32  
**ワークフロー**: `.github/workflows/visual-tests.yml`