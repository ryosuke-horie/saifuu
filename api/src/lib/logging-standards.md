# ロギング標準

## 概要

このドキュメントは、APIのロギングにおける一貫性を保つための標準を定義します。

## パラメータ命名規則

### リソースID
リソースのIDをログに記録する際は、以下の命名規則に従います：

- `transactionId`: 取引ID
- `categoryId`: カテゴリID
- `userId`: ユーザーID（将来的な拡張用）

**一貫性の原則**: `{resourceName}Id` の形式を使用

### 共通パラメータ

#### 成功時のログ
```typescript
requestLogger.success({
  transactionId: number,      // リソースID
  type?: string,              // リソースタイプ（必要な場合）
  updatedFields?: string[],   // 更新されたフィールド（UPDATE時）
  transactionsCount?: number, // 取得件数（LIST時）
  filters?: object,           // 適用されたフィルタ（LIST時）
})
```

#### 警告時のログ
```typescript
requestLogger.warn('メッセージ', {
  transactionId?: number,          // 対象リソースID（存在する場合）
  validationErrors?: array,        // バリデーションエラー
  providedData?: object,           // 提供されたデータ（デバッグ用）
})
```

#### エラー時のログ
```typescript
requestLogger.error('メッセージ', {
  transactionId?: number,          // 対象リソースID（存在する場合）
  error: string | Error,           // エラー情報
  stack?: string,                  // スタックトレース
})
```

## 操作別ログパラメータ

### LIST操作
```typescript
{
  transactionsCount: number,
  filters: {
    type?: 'income' | 'expense',
    categoryId?: number,
    dateRange?: {
      start?: string,
      end?: string,
    }
  }
}
```

### CREATE操作
```typescript
{
  transactionId: number,    // 作成されたリソースのID
  type: string,             // リソースのタイプ
}
```

### UPDATE操作
```typescript
{
  transactionId: number,
  updatedFields: string[],  // 更新されたフィールド名の配列
}
```

### DELETE操作
```typescript
{
  transactionId: number,
}
```

### 統計操作
```typescript
{
  statsType: 'income' | 'expense',
  totalIncome?: number,
  incomeCount?: number,
  totalExpense?: number,
  transactionCount?: number,
}
```

## メッセージ規約

### 日本語メッセージ
- 成功: 操作の完了を簡潔に表現
- 警告: 問題の内容を明確に表現
- エラー: エラーの原因を明確に表現

### 例
- ✅ 良い例: "取引が見つからない"
- ❌ 悪い例: "Not found"

## 実装例

```typescript
// LIST
requestLogger.success({
  transactionsCount: results.length,
  filters: { type: 'income', categoryId: 1 }
})

// CREATE
requestLogger.success({
  transactionId: newTransaction.id,
  type: newTransaction.type,
})

// UPDATE
requestLogger.success({
  transactionId: id,
  updatedFields: ['amount', 'description'],
})

// DELETE
requestLogger.success({
  transactionId: id,
})

// NOT FOUND
requestLogger.warn('取引が見つからない', {
  transactionId: id,
})

// VALIDATION ERROR
requestLogger.warn('バリデーションエラー', {
  validationErrors: errors,
  providedData: requestBody,
})
```