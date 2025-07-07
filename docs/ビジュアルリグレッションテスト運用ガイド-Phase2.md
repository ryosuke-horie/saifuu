# ビジュアルリグレッションテスト運用ガイド - Phase 2

## 概要

Phase 2で実装された主要コンポーネントのビジュアルリグレッションテストの運用方法とベストプラクティスを記載したドキュメントです。

**対象Issue**: #120  
**実装フェーズ**: Phase 2 - コアコンポーネントへのビジュアルテスト適用  
**作成日**: 2025年7月7日

## 対象コンポーネント

### Tier 1: 基盤コンポーネント（最重要）

#### 1. Dialog (`/frontend/src/components/ui/Dialog.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`WithTitle`、`LongContent`
- `Mobile`、`Tablet`
- `AlertDialog`

**テスト重要ポイント**:
- モーダルオーバーレイの表示
- コンテンツ配置とスクロール処理
- レスポンシブでのモーダルサイズ変化

#### 2. SubscriptionForm (`/frontend/src/components/subscriptions/SubscriptionForm.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`EditMode`、`WithValidationErrors`
- `Mobile`、`Tablet`、`Desktop`
- `AmountBoundaryTest`

**テスト重要ポイント**:
- フォームレイアウトの整合性
- バリデーションエラー表示の一貫性
- レスポンシブでのフィールド配置変化

#### 3. SubscriptionList (`/frontend/src/components/subscriptions/SubscriptionList.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`Loading`、`ErrorState`、`Empty`
- `Mobile`、`Tablet`、`Desktop`
- `ManyItems`

**テスト重要ポイント**:
- テーブル/カードレイアウトの切り替え
- 各種状態（ローディング、エラー、空）の表示
- データ密度とスクロール表示

### Tier 2: 統合コンポーネント

#### 4. NewSubscriptionDialog (`/frontend/src/components/subscriptions/NewSubscriptionDialog.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`Submitting`
- `MobileView`、`TabletView`

#### 5. Header (`/frontend/src/components/layout/Header.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`CustomTitle`
- `Mobile`、`Tablet`、`Desktop`

#### 6. NewSubscriptionButton (`/frontend/src/components/subscriptions/NewSubscriptionButton.tsx`)
**ビジュアルテスト対象ストーリー**:
- `Default`、`Disabled`、`WithCustomClass`

## 技術実装詳細

### ビジュアルテストタグ設定

すべての対象ストーリーには以下のタグとパラメータが設定済みです：

```typescript
export const StoryName: Story = {
  // ... story configuration
  tags: ["visual-test"],
  parameters: {
    chromatic: {
      delay: 100-300, // コンポーネントの複雑さに応じて調整
      diffThreshold: 0.2, // 必要に応じて設定
    },
  },
};
```

### デレイ設定一覧

| コンポーネント | デレイ時間 | 理由 |
|----------------|------------|------|
| Dialog | 300ms | モーダルアニメーション完了待ち |
| SubscriptionForm | 200ms | フォームレンダリング完了待ち |
| SubscriptionList | 300ms | テーブル/カード変換完了待ち |
| Header | 100ms | ナビゲーションレンダリング完了待ち |
| NewSubscriptionButton | 100ms | ボタンレンダリング完了待ち |

## 運用プロセス

### 1. 新機能開発時のワークフロー

#### ステップ1: コンポーネント開発
1. 既存のStorybook実装を参考にコンポーネントを開発
2. 基本的なストーリーを作成
3. 機能テスト（interaction tests）を実装

#### ステップ2: ビジュアルテスト追加
1. 重要なストーリーに `tags: ["visual-test"]` を追加
2. 適切な `chromatic.delay` パラメータを設定
3. レスポンシブが重要な場合は viewport パラメータも設定

#### ステップ3: ローカル検証
```bash
# ビジュアルテスト実行
npm run test:visual

# 初回は自動的にベースラインが生成される
# 変更がある場合は差分が表示される
```

#### ステップ4: スナップショット確認・更新
意図的な変更の場合のみ：
```bash
# スナップショット更新
npm run test:visual -- --update-snapshots
```

### 2. プルリクエスト作成・レビュー時

#### 作成者の責務
1. **変更内容の明記**: PRの説明に視覚的変更の有無を記載
2. **スナップショット更新理由**: 更新した場合は理由を明記
3. **影響範囲の特定**: 変更したコンポーネントとその依存関係を明記

#### レビュアーの確認事項
1. **意図的な変更確認**: スナップショット変更が意図的かを確認
2. **回帰リスク評価**: 他コンポーネントへの影響がないか確認
3. **デザイン一貫性**: ブランドガイドラインとの整合性確認

### 3. デザイン変更時のワークフロー

#### デザインシステム変更時
1. **影響範囲調査**: 変更対象コンポーネントをリストアップ
2. **段階的更新**: Tier順に段階的にスナップショット更新
3. **回帰テスト**: 全コンポーネントでのビジュアルテスト実行

#### 個別コンポーネント変更時
1. **事前確認**: デザイナーとの変更内容すり合わせ
2. **実装**: 既存ストーリーでの動作確認
3. **更新**: 該当ストーリーのスナップショット更新

## スナップショット管理

### ディレクトリ構造
```
src/
├── components/
│   └── ui/
│       ├── Dialog.stories.tsx
│       └── __screenshots__/
│           └── Dialog.stories.tsx/
│               ├── Default--visual-test.png
│               ├── WithTitle--visual-test.png
│               └── Mobile--visual-test.png
```

### ファイル命名規則
- 形式: `[StoryName]--visual-test.png`
- レスポンシブ: viewport名が自動付与（例: `Default--visual-test--mobile.png`）

### Git管理ルール
- **管理対象**: ベースラインスナップショット（`.png`ファイル）
- **除外対象**: 一時的な差分ファイル（`__vis__/`ディレクトリ）

## トラブルシューティング

### 頻繁にスナップショットが変わる場合

#### 原因1: フォント・レンダリング環境差
**対策**: 
- 開発環境統一（mise + Docker等）
- font-displayプロパティの統一

#### 原因2: 動的要素（時刻、ランダム値）
**対策**:
- MSWでのモックデータ固定
- `chromatic.delay`の調整

#### 原因3: アニメーション
**対策**:
- CSS `prefers-reduced-motion` への対応
- Storybook用アニメーション無効化設定

### 実行時エラーの対処

#### Browser Mode エラー
```bash
# Playwright再インストール
npx playwright install chromium
```

#### メモリ不足エラー
```bash
# 並列実行数制限
npm run test:visual -- --threads=2
```

## パフォーマンス最適化

### テスト実行時間短縮
1. **対象ストーリー絞り込み**: 重要なストーリーのみタグ付け
2. **並列実行**: CI環境でのシャーディング
3. **キャッシュ活用**: 将来的なNode.jsキャッシュ復活時

### GitHub Actions制約対応
- **E2E無効化**: Visual Testing優先でE2Eテスト制限
- **セルフホストランナー**: 安定した実行環境確保
- **実行トリガー**: 重要なブランチでの選択的実行

## メンテナンス

### 定期メンテナンス（月次）
1. **不要スナップショット整理**: 削除されたストーリーのクリーンアップ
2. **False Positive確認**: 頻繁に変わるスナップショットの見直し
3. **パフォーマンス分析**: 実行時間トレンド分析

### 四半期レビュー
1. **対象コンポーネント見直し**: 新規追加・優先度変更検討
2. **閾値調整**: `diffThreshold`等の設定見直し
3. **ツール更新**: storybook-addon-vis等の更新検討

## 成功指標

### 定量指標
- **対象コンポーネント数**: 6個（Tier 1: 3個、Tier 2: 3個）
- **ビジュアルテスト対象ストーリー数**: 24個
- **False Positive率**: 月間5%以下
- **実行時間**: 5分以内（フル実行）

### 定性指標
- チームメンバー全員がスナップショット更新操作可能
- デザイン変更時の回帰リスクを事前検出
- PRレビュー時の視覚的確認プロセス確立

## 今後の展開

### Phase 3 予定（CI/CD統合）
- GitHub Actionsでの自動実行
- アーティファクト保存とレビューフロー
- Slack連携での結果通知

### Phase 4 予定（拡張・最適化）
- 複合コンポーネントへの拡張
- ページレベルコンポーネント検討
- メンテナンス性向上

---

**関連ドキュメント**:
- [ビジュアルリグレッションテスト実装ガイド.md](./ビジュアルリグレッションテスト実装ガイド.md)
- [ビジュアルリグレッションテスト実装計画.md](./ビジュアルリグレッションテスト実装計画.md)
- [Storybook実装詳細.md](./storybook/実装詳細.md)