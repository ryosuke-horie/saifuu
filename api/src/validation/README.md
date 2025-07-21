# API Validation Module

このモジュールは、共有バリデーションフレームワークを使用してAPI固有のバリデーションスキーマを提供します。

## 使用方法

### 取引（Transaction）のバリデーション

```typescript
import { validateTransactionCreate, validateTransactionUpdate } from '../validation'

// 作成時のバリデーション
const createResult = validateTransactionCreate({
  amount: 1000,
  type: 'expense',
  date: '2024-01-01',
  categoryId: 1,
  description: '昼食代'
})

if (!createResult.success) {
  // エラー処理
  return c.json({ errors: createResult.errors }, 400)
}

// 成功時はcreateResult.dataに型安全なデータが入っている
const transaction = createResult.data

// 更新時のバリデーション（部分更新）
const updateResult = validateTransactionUpdate({
  amount: 1500,
  description: '夕食代'
})

if (!updateResult.success) {
  // エラー処理
  return c.json({ errors: updateResult.errors }, 400)
}
```

### サブスクリプション（Subscription）のバリデーション

```typescript
import { validateSubscriptionCreate, validateSubscriptionUpdate } from '../validation'

// 作成時のバリデーション
const createResult = validateSubscriptionCreate({
  name: 'Netflix',
  amount: 1500,
  billingCycle: 'monthly',
  nextBillingDate: '2024-02-01',
  categoryId: 1,
  description: '動画配信サービス',
  isActive: true
})

if (!createResult.success) {
  // エラー処理
  return c.json({ errors: createResult.errors }, 400)
}

// 更新時のバリデーション（部分更新）
const updateResult = validateSubscriptionUpdate({
  amount: 1800,
  isActive: false
})

if (!updateResult.success) {
  // エラー処理
  return c.json({ errors: updateResult.errors }, 400)
}
```

### ID検証

```typescript
import { validateId } from '../validation'

// パスパラメータからIDを取得して検証
const idResult = validateId(c.req.param('id'))

if (!idResult.success) {
  return c.json({ errors: idResult.errors }, 400)
}

// 成功時はidResult.dataに数値型のIDが入っている
const id = idResult.data
```

## エクスポートされるバリデーター

### 共通バリデーター
- `idValidator` - ID検証用バリデーター
- `amountValidator` - 金額検証用バリデーター
- `categoryIdValidator` - カテゴリID検証用バリデーター（オプショナル）
- `dateStringValidator` - 日付文字列検証用バリデーター
- `descriptionValidator` - 説明文検証用バリデーター（オプショナル）

### バリデーション関数
- `validateId(id: unknown)` - ID検証
- `validateTransactionCreate(data)` - 取引作成データ検証
- `validateTransactionUpdate(data)` - 取引更新データ検証
- `validateSubscriptionCreate(data)` - サブスクリプション作成データ検証
- `validateSubscriptionUpdate(data)` - サブスクリプション更新データ検証

### バリデーションスキーマ
- `transactionCreateSchema` - 取引作成用スキーマ
- `transactionUpdateSchema` - 取引更新用スキーマ
- `subscriptionCreateSchema` - サブスクリプション作成用スキーマ
- `subscriptionUpdateSchema` - サブスクリプション更新用スキーマ

## エラーレスポンス

バリデーションエラーは以下の形式で返されます：

```typescript
{
  success: false,
  errors: [
    {
      field: 'amount',
      message: '金額は正の数値である必要があります',
      code: 'POSITIVE_NUMBER'
    }
  ]
}
```

## 制限値

共有バリデーションフレームワークの`VALIDATION_LIMITS`を使用：
- 最大金額: 10,000,000円
- 最小金額: 1円
- 名前の最大文字数: 100文字
- 説明の最大文字数: 500文字
- 最小日付: 2000-01-01