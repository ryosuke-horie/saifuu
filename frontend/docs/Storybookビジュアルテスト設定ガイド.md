# Storybook ビジュアルテスト設定ガイド

## 概要

このプロジェクトでは `storybook-addon-vis` を使用して包括的なビジュアルテストを実装しています。このガイドでは、ビジュアルテストの設定方法と使用例について説明します。

## 設定済み内容

### 1. アドオンの設定

#### `.storybook/main.ts`
```typescript
addons: [
  // ... 他のアドオン
  "storybook-addon-vis",
],
```

#### `.storybook/preview.ts`
グローバルなビジュアルテスト設定を追加済み：

```typescript
vis: {
  // 基本設定
  enable: true,
  
  // デフォルトの遅延時間（アニメーション完了を待つ）
  delay: 200,
  
  // 基本的なビューポート設定
  viewports: [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1280, height: 800 },
  ],
  
  // 比較しきい値の設定
  threshold: 0.1,
  diffThreshold: 0.15,
}
```

### 2. ストーリーレベルでの設定

#### 基本的なビジュアルテスト設定
```typescript
export const Default: Story = {
  tags: ["visual-test"],
  parameters: {
    vis: {
      delay: 300,
      description: "Clean component layout",
      viewports: ["mobile", "tablet", "desktop"],
    },
  },
};
```

#### インタラクション後のキャプチャ
```typescript
export const WithValidation: Story = {
  tags: ["visual-test"],
  parameters: {
    vis: {
      delay: 500,
      description: "Component with validation errors",
      viewports: ["mobile", "desktop"],
      captureAfterInteraction: true,
    },
  },
  play: async ({ canvasElement }) => {
    // インタラクション後にスクリーンショットを撮影
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
  },
};
```

## ビジュアルテストパターン

### 1. 基本パターン

#### デフォルト状態
```typescript
export const Default: Story = {
  tags: ["visual-test"],
  parameters: {
    vis: {
      description: "Default component appearance",
      viewports: ["desktop"],
    },
  },
};
```

#### レスポンシブテスト
```typescript
export const Responsive: Story = {
  tags: ["visual-test"],
  parameters: {
    vis: {
      description: "Component across all viewport sizes",
      viewports: ["mobile", "tablet", "desktop"],
    },
  },
};
```

### 2. 状態別テスト

#### ローディング状態
```typescript
export const Loading: Story = {
  args: { isLoading: true },
  tags: ["visual-test"],
  parameters: {
    vis: {
      delay: 300,
      description: "Loading state with spinner",
      viewports: ["desktop"],
    },
  },
};
```

#### エラー状態
```typescript
export const Error: Story = {
  args: { error: "エラーメッセージ" },
  tags: ["visual-test"],
  parameters: {
    vis: {
      description: "Error state display",
      viewports: ["mobile", "desktop"],
    },
  },
};
```

### 3. インタラクション後テスト

#### フォームバリデーション
```typescript
export const ValidationErrors: Story = {
  tags: ["visual-test"],
  parameters: {
    vis: {
      delay: 500,
      description: "Form with validation errors",
      viewports: ["mobile", "desktop"],
      captureAfterInteraction: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // エラーを発生させる操作
    await userEvent.click(canvas.getByRole("button", { name: "送信" }));
    
    // エラー表示を確認
    await expect(canvas.getByText("必須項目です")).toBeInTheDocument();
  },
};
```

#### ダイアログ・モーダル
```typescript
export const ModalOpen: Story = {
  args: { isOpen: true },
  tags: ["visual-test"],
  parameters: {
    vis: {
      delay: 300, // アニメーション完了を待つ
      description: "Modal dialog with overlay",
      viewports: ["mobile", "tablet", "desktop"],
    },
  },
};
```

## 高度な設定

### 1. しきい値の調整

#### 厳密な比較
```typescript
parameters: {
  vis: {
    threshold: 0.05,      // より厳密な比較
    diffThreshold: 0.1,   // 小さな差異も検出
  },
},
```

#### 寛容な比較（アニメーションがある場合）
```typescript
parameters: {
  vis: {
    threshold: 0.2,       // アニメーションの差異を許容
    diffThreshold: 0.3,   // 大きな差異のみ検出
  },
},
```

### 2. 特定のビューポートでの詳細テスト

#### モバイル特化
```typescript
export const MobileSpecific: Story = {
  tags: ["visual-test"],
  parameters: {
    viewport: { defaultViewport: "mobile1" },
    vis: {
      description: "Mobile-specific layout and interactions",
      viewports: ["mobile"],
      // モバイル特有の要素を確認
    },
  },
};
```

#### デスクトップ特化
```typescript
export const DesktopSpecific: Story = {
  tags: ["visual-test"],
  parameters: {
    viewport: { defaultViewport: "desktop" },
    vis: {
      description: "Desktop-specific layout with expanded features",
      viewports: ["desktop"],
    },
  },
};
```

## ベストプラクティス

### 1. タグの使用

#### visual-test タグ
- ビジュアルテスト専用のストーリーには必ず `visual-test` タグを付与
- Storybookのフィルタリング機能で視覚テストのみを実行可能

```typescript
tags: ["visual-test"]
```

### 2. 説明の記載

#### わかりやすい説明
```typescript
vis: {
  description: "Dialog with loading state and disabled form elements",
}
```

#### 日本語での説明も可能
```typescript
vis: {
  description: "ローディング状態でフォーム要素が無効化されたダイアログ",
}
```

### 3. 遅延時間の設定

#### アニメーション完了を待つ
```typescript
vis: {
  delay: 300, // CSSアニメーションの完了時間に合わせて調整
}
```

#### 非同期処理を待つ
```typescript
vis: {
  delay: 500, // データ取得やバリデーション処理の完了を待つ
}
```

### 4. ビューポートの選択

#### 全ビューポートテスト
```typescript
viewports: ["mobile", "tablet", "desktop"]
```

#### 重要なビューポートのみ
```typescript
viewports: ["mobile", "desktop"] // タブレットを省略
```

#### 単一ビューポート（詳細確認）
```typescript
viewports: ["desktop"] // デスクトップでの詳細な動作確認
```

## トラブルシューティング

### 1. スクリーンショットの差異

#### 原因
- フォントレンダリングの差異
- アニメーションのタイミング
- 動的コンテンツ（日付、時刻など）

#### 対策
```typescript
vis: {
  delay: 500,           // 十分な待機時間
  threshold: 0.15,      // しきい値を調整
  diffThreshold: 0.2,   // 差異の許容範囲を拡大
}
```

### 2. インタラクション後のキャプチャが取れない

#### 解決方法
```typescript
parameters: {
  vis: {
    captureAfterInteraction: true, // 必須設定
    delay: 600, // play関数完了後の待機時間を十分に設定
  },
},
play: async ({ canvasElement }) => {
  // インタラクション実行
  // 最後に少し待機時間を追加
  await new Promise(resolve => setTimeout(resolve, 100));
},
```

### 3. レスポンシブテストの設定漏れ

#### チェックポイント
- `viewport.defaultViewport` の設定
- `vis.viewports` の配列指定
- Chromatic設定との整合性

```typescript
parameters: {
  viewport: { defaultViewport: "mobile1" },
  vis: {
    viewports: ["mobile"], // viewportと一致させる
  },
  chromatic: {
    viewports: [375], // 数値での指定も可能
  },
},
```

## 実装例

プロジェクト内の実装例：

- `/src/components/layout/Header.stories.tsx` - 基本的なビジュアルテスト
- `/src/components/ui/Dialog.stories.tsx` - モーダル・アニメーションテスト
- `/src/components/subscriptions/NewSubscriptionDialog.stories.tsx` - 複合コンポーネントテスト
- `/src/components/subscriptions/SubscriptionForm.stories.tsx` - フォーム・バリデーションテスト

これらのファイルを参考に、新しいコンポーネントでもビジュアルテストを実装してください。