# テストガイド - Saifuu Frontend

## 概要

このドキュメントは、Saifuu フロントエンドプロジェクトにおけるテストの実装方針と使用方法を説明します。

## テスト戦略

### テストピラミッド

```
E2Eテスト (Playwright)          # 正常系のみ・最小限
    ↑
ストーリーテスト (Storybook)      # コンポーネントテスト  
    ↑
ユニットテスト (Vitest)          # 単体テスト・エラー系
```

### 責務分担

- **Vitest**: ロジック・ユーティリティ関数・バリデーション・エラーハンドリング
- **Storybook**: コンポーネント表示・インタラクション・レスポンシブ
- **Playwright**: 正常系の主要ユーザーフローのみ

## 技術スタック

### テストフレームワーク
- **Vitest**: 高速なユニットテストランナー
- **React Testing Library**: Reactコンポーネントテスト
- **Playwright**: E2Eテスト（最小限）
- **Storybook**: コンポーネント分離開発・視覚的テスト

### テストユーティリティ
- **@testing-library/user-event**: ユーザーインタラクションシミュレーション
- **@faker-js/faker**: リアルなテストデータ生成
- **MSW (Mock Service Worker)**: APIモック
- **@testing-library/jest-dom**: 追加のアサーション

## テストユーティリティ

### カスタムレンダリング関数

```typescript
// test-utils/custom-render.tsx
import { render } from '@/test-utils';

// プロバイダーを自動的に適用
const MyComponent = () => <div>Test</div>;
render(<MyComponent />);
```

### モックデータファクトリー

```typescript
// test-utils/mock-factories.ts
import { createMockSubscription, createMockCategories } from '@/test-utils';

// 単一のモックデータ
const subscription = createMockSubscription();

// 複数のモックデータ
const categories = createMockCategories(5);

// カスタムプロパティ
const customSubscription = createMockSubscription({
  name: 'Netflix',
  amount: 1200,
});
```

### MSWハンドラー

```typescript
// test-utils/msw-handlers.ts
import { createSuccessHandlers, createErrorHandlers } from '@/test-utils';

// 成功レスポンス
const successHandlers = createSuccessHandlers();

// エラーレスポンス
const errorHandlers = createErrorHandlers();
```

## テストパターン

### 基本的なテスト構造

```typescript
// コンポーネント名.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ComponentName />);
      
      expect(screen.getByText('期待されるテキスト')).toBeInTheDocument();
    });
  });

  describe('プロパティテスト', () => {
    it('プロパティが正しく適用される', () => {
      render(<ComponentName title="テストタイトル" />);
      
      expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('ボタンクリックが正しく動作する', async () => {
      const user = userEvent.setup();
      const mockHandler = vi.fn();
      
      render(<ComponentName onClick={mockHandler} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー時に適切なメッセージが表示される', () => {
      render(<ComponentName error="エラーメッセージ" />);
      
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定される', () => {
      render(<ComponentName />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '期待されるラベル');
    });
  });
});
```

### 非同期処理のテスト

```typescript
it('非同期処理が正しく動作する', async () => {
  const user = userEvent.setup();
  
  render(<AsyncComponent />);
  
  await user.click(screen.getByRole('button'));
  
  // ローディング状態の確認
  expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  
  // 結果の確認
  await waitFor(() => {
    expect(screen.getByText('完了しました')).toBeInTheDocument();
  });
});
```

### MSWを使用したAPIテスト

```typescript
import { server } from '@/test-utils/msw-server';
import { createErrorHandlers } from '@/test-utils';

it('API エラー時の処理', async () => {
  // エラーハンドラーを設定
  server.use(...createErrorHandlers());
  
  render(<ApiComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });
});
```

## テストの実行

### 基本コマンド

```bash
# 全てのテストを実行
npm run test:unit

# ウォッチモードで実行
npm run test:unit -- --watch

# カバレッジレポート付きで実行
npm run test:unit -- --coverage

# 特定のファイルのみ実行
npm run test:unit -- ComponentName.test.tsx
```

### テストの設定

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      threshold: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

## ベストプラクティス

### 1. テストの命名規則

- `describe`: コンポーネント名や機能名
- `it`: 「〜が〜する」形式で期待される動作を明確に記述
- 日本語でのテスト説明を推奨

### 2. テストの構造

```typescript
describe('ComponentName', () => {
  describe('基本レンダリング', () => {
    // レンダリング関連のテスト
  });
  
  describe('プロパティテスト', () => {
    // プロパティ関連のテスト
  });
  
  describe('インタラクション', () => {
    // ユーザーインタラクション関連のテスト
  });
  
  describe('エラーハンドリング', () => {
    // エラー処理関連のテスト
  });
  
  describe('アクセシビリティ', () => {
    // アクセシビリティ関連のテスト
  });
});
```

### 3. クエリの優先順位

Testing Library のクエリを優先順位に従って使用：

1. **getByRole** - アクセシビリティ重視
2. **getByLabelText** - フォーム要素用
3. **getByText** - テキスト内容での取得
4. **getByTestId** - 最後の手段

```typescript
// 推奨
screen.getByRole('button', { name: 'サブスクリプションを追加' });

// 非推奨
screen.getByTestId('add-subscription-button');
```

### 4. アサーションの書き方

```typescript
// 良い例
expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();

// 悪い例
expect(screen.getByText('エラーメッセージ')).toBeTruthy();
```

### 5. モックの使用

```typescript
// 必要最小限のモック
vi.mock('@/lib/api/client', () => ({
  fetchSubscriptions: vi.fn(),
}));

// 過度なモックは避ける
// 実際のコンポーネントの挙動をテストする
```

## トラブルシューティング

### よくある問題と解決策

#### 1. act() warning が出る場合

```typescript
// 悪い例
fireEvent.click(button);

// 良い例
await user.click(button);
```

#### 2. 非同期処理でのタイムアウト

```typescript
// waitFor のタイムアウト設定
await waitFor(() => {
  expect(screen.getByText('完了')).toBeInTheDocument();
}, { timeout: 5000 });
```

#### 3. MSW でのリクエスト マッチング

```typescript
// 正確なURL マッチング
http.get(`${API_BASE_URL}/subscriptions`, () => {
  return HttpResponse.json({ subscriptions: [] });
});
```

## カバレッジ目標

- **ブランチカバレッジ**: 80%以上
- **関数カバレッジ**: 80%以上
- **行カバレッジ**: 80%以上
- **文カバレッジ**: 80%以上

## 継続的改善

1. **テストレビュー**: PRレビュー時にテストの品質も確認
2. **定期的な見直し**: テストの実行時間やカバレッジを定期的に確認
3. **エラー分析**: 失敗したテストから学び、テスト改善に活用
4. **新機能対応**: 新機能追加時は必ずテストも追加

## 参考資料

- [Testing Library](https://testing-library.com/)
- [Vitest](https://vitest.dev/)
- [MSW](https://mswjs.io/)
- [Storybook](https://storybook.js.org/)
- [Playwright](https://playwright.dev/)