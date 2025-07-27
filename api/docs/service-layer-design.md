# サービス層の設計改善プラン

## 現状の課題

現在のサービス層（特に`TransactionService`）において、エラー処理の型定義が複雑で一貫性に欠ける部分があります。

### 具体的な問題点

1. **オプショナルプロパティの多用**
   ```typescript
   {
     success: false
     errors?: ValidationError[]
     notFound?: boolean
   }
   ```
   どのプロパティが存在するかが不明確

2. **エラータイプの判別が困難**
   - エラーの種類を判別するための明確な識別子がない
   - クライアント側でのエラーハンドリングが複雑

## 改善案：Discriminated Unionパターン

### 1. 明確なエラータイプの定義

```typescript
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: 'VALIDATION_ERROR'; details: ValidationError[] }
  | { success: false; error: 'NOT_FOUND'; resourceId: number }
  | { success: false; error: 'DATABASE_ERROR'; message: string }
```

### 2. 型ガードの実装

```typescript
const isValidationError = (result: ServiceResult<unknown>): 
  result is { success: false; error: 'VALIDATION_ERROR'; details: ValidationError[] } => {
  return !result.success && result.error === 'VALIDATION_ERROR'
}
```

### 3. クライアント側での使用例

```typescript
const result = await transactionService.updateTransaction(id, data)

if (result.success) {
  // 成功時の処理
  console.log(result.data)
} else {
  switch (result.error) {
    case 'VALIDATION_ERROR':
      // バリデーションエラーの処理
      handleValidationErrors(result.details)
      break
    case 'NOT_FOUND':
      // Not Foundエラーの処理
      handleNotFound(result.resourceId)
      break
    case 'DATABASE_ERROR':
      // データベースエラーの処理
      handleDatabaseError(result.message)
      break
  }
}
```

## 実装上の考慮事項

### 1. 段階的な移行

- 新規サービスから適用
- 既存サービスは互換性を保ちながら段階的に移行

### 2. 共通型の定義

`src/types/service-results.ts`に共通の結果型を定義済み：

- `SuccessResult<T>`
- `ValidationErrorResult`
- `NotFoundErrorResult`
- `DatabaseErrorResult`

### 3. ヘルパー関数の活用

```typescript
import { ServiceResults } from '../types/service-results'

// 成功
return ServiceResults.success(data)

// バリデーションエラー
return ServiceResults.validationError('入力値が不正です', errors)

// Not Found
return ServiceResults.notFound('Transaction', id)
```

## 移行計画

### フェーズ1（現在）
- 型定義の準備完了
- ヘルパー関数の実装完了

### フェーズ2（次のスプリント）
- 新規サービスでの採用
- 既存サービスの段階的リファクタリング

### フェーズ3（将来）
- 全サービスの統一
- クライアント側のエラーハンドリング最適化

## メリット

1. **型安全性の向上**: コンパイル時にエラー処理の漏れを検出
2. **可読性の向上**: エラーの種類が明確
3. **保守性の向上**: 新しいエラータイプの追加が容易
4. **DX向上**: IDEの補完が効果的に機能

## 注意点

- 既存APIとの互換性を保つ
- クライアント側の変更も必要
- テストの更新が必要