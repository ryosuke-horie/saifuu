# バリデーションフレームワーク (Zod版)

## 概要

2025年1月の更新により、カスタムバリデーションフレームワークからZodライブラリへ移行しました。Zodは型安全性とDXを大幅に向上させる、モダンなTypeScriptファーストのバリデーションライブラリです。

## 移行の背景

### 既存の課題
- カスタム実装のため、メンテナンスコストが高い
- エコシステムとの統合が困難
- 型推論が限定的

### Zodの利点
- **型推論**: スキーマから自動的に型を生成
- **エコシステム**: React Hook Form、tRPCなどとの統合が容易
- **メンテナンス**: 活発なコミュニティによる継続的な改善
- **パフォーマンス**: 最適化されたバリデーション処理

## 基本的な使い方

### 1. スキーマ定義

```typescript
import { z } from 'zod/v3'

// 基本的なスキーマ
const userSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  age: z.number().min(0).max(120),
  email: z.string().email('有効なメールアドレスを入力してください')
})

// 型の自動生成
type User = z.infer<typeof userSchema>
```

### 2. バリデーション実行

```typescript
// 安全なパース（エラーをthrowしない）
const result = userSchema.safeParse(data)

if (result.success) {
  console.log(result.data) // 型安全なデータ
} else {
  console.log(result.error.issues) // エラー詳細
}

// 通常のパース（エラーをthrow）
try {
  const user = userSchema.parse(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues)
  }
}
```

## Saifuuでの実装

### 共通スキーマ（shared/src/validation/zod-schemas.ts）

```typescript
// 金額スキーマ
export const amountSchema = z
  .number({
    required_error: '金額は必須です',
    invalid_type_error: '金額は数値である必要があります',
  })
  .min(1, '金額は1円以上である必要があります')
  .max(10000000, '金額は10000000円以下である必要があります')

// 取引作成スキーマ
export const transactionCreateSchema = z.object({
  amount: amountSchema,
  type: z.enum(['income', 'expense'], {
    required_error: 'typeは必須です',
    invalid_type_error: 'typeはincomeまたはexpenseのいずれかである必要があります',
  }),
  date: dateSchema,
  categoryId: z.number().int().positive().optional(),
  description: z.string().max(200).optional(),
})
```

### 日本語エラーメッセージ

```typescript
// カスタムエラーマップで日本語化
const zodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  const fieldName = issue.path && issue.path.length > 0 ? issue.path.join('.') : 'フィールド'
  
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string' && issue.received === 'undefined') {
      return { message: `${fieldName}は必須です` }
    }
    // ... 他のエラータイプ
  }
  
  return { message: ctx?.defaultError || 'バリデーションエラー' }
}

z.setErrorMap(zodErrorMap)
```

### API実装例

```typescript
// api/src/routes/transactions-with-zod.ts
app.post('/', async (c) => {
  const body = await c.req.json()
  
  // Zodバリデーション
  const validationResult = validateTransactionCreateWithZod(body)
  
  if (!validationResult.success) {
    return c.json({
      error: validationResult.errors[0]?.message || 'Validation failed',
      details: validationResult.errors
    }, 400)
  }
  
  // バリデーション成功、DBに保存
  const transaction = await db.insert(transactions).values(validationResult.data)
  return c.json(transaction, 201)
})
```

### フロントエンド実装例

```typescript
// frontend/src/lib/validation/zod-validation.ts
export function validateExpenseFormWithZod(data: ExpenseFormData): {
  success: boolean
  errors: Record<string, string>
} {
  const apiData = toApiTransactionFormat(data)
  const result = transactionCreateSchema.safeParse(apiData)
  
  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      const field = issue.path[0]?.toString() || 'unknown'
      errors[field] = issue.message
    })
    return { success: false, errors }
  }
  
  return { success: true, errors: {} }
}
```

## 利用可能なスキーマ

### 基本スキーマ

| スキーマ | 説明 | 制限 |
|---------|------|------|
| `amountSchema` | 金額 | 1円〜10,000,000円 |
| `dateSchema` | 日付 | 2000-01-01以降、ISO形式 |
| `nameSchema` | 名前 | 必須、最大100文字 |
| `descriptionSchema` | 説明 | オプション、最大200文字 |
| `idSchema` | ID | 正の整数、文字列からの変換対応 |

### 複合スキーマ

| スキーマ | 用途 |
|---------|------|
| `transactionCreateSchema` | 取引作成 |
| `transactionUpdateSchema` | 取引更新 |
| `subscriptionCreateSchema` | サブスク作成 |
| `subscriptionUpdateSchema` | サブスク更新 |

## 型の活用

```typescript
// スキーマから型を推論
type Transaction = z.infer<typeof transactionCreateSchema>

// 部分的な型
type PartialTransaction = z.infer<typeof transactionUpdateSchema>

// 単一フィールドの型
type Amount = z.infer<typeof amountSchema>
```

## 移行ガイド

### 既存コードからの移行

```typescript
// 既存（カスタムバリデーション）
import { validateAmount } from '@/lib/validation/form-validation'
const error = validateAmount(1000, 'amount')

// Zod版
import { amountSchema } from '@/shared/validation/zod-schemas'
const result = amountSchema.safeParse(1000)
if (!result.success) {
  const error = result.error.issues[0].message
}
```

### APIルートの移行

```typescript
// 既存
import { validateTransactionCreate } from '../validation/schemas'

// Zod版
import { validateTransactionCreateWithZod } from '../validation/zod-validators'
```

## ベストプラクティス

1. **スキーマの再利用**: 共通スキーマを定義して再利用
2. **型推論の活用**: `z.infer`で型を自動生成
3. **エラーメッセージの一貫性**: カスタムエラーマップで統一
4. **段階的な移行**: 並行実装で安全に移行
5. **テストの充実**: スキーマ変更時は必ずテスト更新

## パフォーマンス考慮事項

- **パースの最適化**: 大量データの場合は`parseAsync`を使用
- **スキーマのメモ化**: 頻繁に使用するスキーマはメモ化
- **部分的なバリデーション**: 必要なフィールドのみ検証

## 今後の拡張

- **条件付きバリデーション**: `z.discriminatedUnion`や`z.union`の活用
- **非同期バリデーション**: DBチェックなどの統合
- **カスタム型**: ドメイン固有の型定義
- **国際化**: 多言語対応のエラーメッセージ

## 関連ドキュメント

- [Zodバリデーション移行ガイド](./移行ガイド/Zodバリデーション移行ガイド.md)
- [削除ファイルリスト](./移行ガイド/削除ファイルリスト.md)
- [Zod公式ドキュメント](https://zod.dev)