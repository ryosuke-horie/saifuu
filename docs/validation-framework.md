# バリデーションフレームワーク

## 概要

`shared/src/validation/index.ts` で定義される共通バリデーションフレームワークは、API/Frontend間で一貫性のあるバリデーションロジックを提供します。

## 主な特徴

- **型安全性**: TypeScriptの型システムを活用した型安全なバリデーション
- **コンポーザブル**: 複数のバリデーターを組み合わせて複雑なルールを構築可能
- **統一された制限値**: API/Frontend間で同じ制限値を使用
- **標準化されたエラーメッセージ**: 一貫性のあるユーザーフレンドリーなエラーメッセージ

## 基本的な使い方

### 1. 単一フィールドのバリデーション

```typescript
import { required, numeric, positiveNumber } from 'shared/src/validation';

// 必須チェック
const nameValidator = required<string>();
const error = nameValidator('', 'name'); // { field: 'name', message: 'nameは必須です', code: 'REQUIRED' }

// 数値範囲チェック
const ageValidator = numeric(0, 120);
const error = ageValidator(150, 'age'); // { field: 'age', message: 'ageは120以下である必要があります', code: 'MAX_VALUE' }

// 正の数チェック
const amountValidator = positiveNumber();
const error = amountValidator(-100, 'amount'); // エラー
```

### 2. 複数のバリデーターの組み合わせ

```typescript
import { compose, required, numeric, VALIDATION_LIMITS } from 'shared/src/validation';

// 金額バリデーター: 必須 + 正の数 + 上限チェック
const amountValidator = compose(
  required<number>(),
  positiveNumber(),
  numeric(VALIDATION_LIMITS.MIN_AMOUNT, VALIDATION_LIMITS.MAX_AMOUNT)
);

const error = amountValidator(null, 'amount'); // 必須エラー
const error2 = amountValidator(-100, 'amount'); // 正の数エラー
const error3 = amountValidator(20000000, 'amount'); // 上限エラー
```

### 3. オブジェクト全体のバリデーション

```typescript
import { validateObject, validators } from 'shared/src/validation';

const transactionData = {
  name: '昼食',
  amount: 1000,
  date: '2024-01-01',
  description: 'ランチ代'
};

const result = validateObject(transactionData, {
  name: validators.name,
  amount: validators.amount,
  date: validators.date,
  description: validators.description
});

if (result.success) {
  // バリデーション成功
  console.log(result.data); // 型安全なデータ
} else {
  // バリデーション失敗
  console.log(result.errors); // エラーの配列
}
```

## 利用可能なバリデーター

### 基本バリデーター

| バリデーター | 説明 | 使用例 |
|------------|------|-------|
| `required()` | 必須フィールドチェック | `required<string>()` |
| `numeric(min?, max?)` | 数値範囲チェック | `numeric(0, 100)` |
| `positiveNumber()` | 正の数チェック | `positiveNumber()` |
| `string(maxLength?)` | 文字列長チェック | `string(100)` |
| `date(minDate?)` | 日付チェック | `date(new Date('2000-01-01'))` |
| `enumValidator(values)` | 列挙値チェック | `enumValidator(['A', 'B', 'C'])` |

### プリセットバリデーター

```typescript
import { validators } from 'shared/src/validation';

// 金額: 必須 + 正の数 + ¥1〜¥10,000,000
validators.amount

// 名前: 必須 + 最大100文字
validators.name

// 説明: オプショナル + 最大500文字
validators.description

// 日付: 必須 + 2000年1月1日以降
validators.date
```

## 共通制限値

```typescript
import { VALIDATION_LIMITS } from 'shared/src/validation';

// 金額の制限
VALIDATION_LIMITS.MAX_AMOUNT // ¥10,000,000
VALIDATION_LIMITS.MIN_AMOUNT // ¥1

// 文字列長の制限
VALIDATION_LIMITS.MAX_NAME_LENGTH // 100文字
VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH // 500文字

// 日付の制限
VALIDATION_LIMITS.MIN_DATE // 2000-01-01
```

## API/Frontendでの使用例

### Frontendでの使用

```typescript
// frontend/src/components/ExpenseForm.tsx
import { validateObject, validators } from 'shared/src/validation';

const handleSubmit = (formData: FormData) => {
  const result = validateObject(formData, {
    name: validators.name,
    amount: validators.amount,
    date: validators.date,
    description: validators.description
  });

  if (!result.success) {
    // エラー表示
    result.errors.forEach(error => {
      showError(error.field, error.message);
    });
    return;
  }

  // バリデーション成功、APIへ送信
  submitToAPI(result.data);
};
```

### APIでの使用

```typescript
// api/src/routes/transactions.ts
import { validateObject, validators } from 'shared/src/validation';

app.post('/api/transactions', async (c) => {
  const body = await c.req.json();
  
  const result = validateObject(body, {
    name: validators.name,
    amount: validators.amount,
    date: validators.date,
    categoryId: compose(required<number>(), numeric(1))
  });

  if (!result.success) {
    return c.json({ errors: result.errors }, 400);
  }

  // バリデーション成功、データベースへ保存
  const transaction = await createTransaction(result.data);
  return c.json(transaction);
});
```

## カスタムバリデーターの作成

```typescript
import { type Validator, ERROR_MESSAGES } from 'shared/src/validation';

// カタカナのみを許可するバリデーター
const katakanaOnly: Validator<string> = (value: string, fieldName: string) => {
  if (!/^[ァ-ヶー]*$/.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName}はカタカナのみ入力可能です`,
      code: 'KATAKANA_ONLY'
    };
  }
  return null;
};

// 使用例
const nameValidator = compose(
  required<string>(),
  katakanaOnly
);
```

## 型定義

```typescript
// バリデーション結果の型
type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

// エラーの型
interface ValidationError {
  field: string;      // エラーが発生したフィールド名
  message: string;    // エラーメッセージ
  code?: string;      // エラーコード（オプション）
}

// バリデーター関数の型
type Validator<T> = (value: T, fieldName: string) => ValidationError | null;
```

## ベストプラクティス

1. **共通の制限値を使用**: ハードコードせず、`VALIDATION_LIMITS`を使用
2. **プリセットバリデーターを活用**: 一般的なケースには`validators`オブジェクトを使用
3. **エラーメッセージの一貫性**: カスタムメッセージは本当に必要な場合のみ使用
4. **型安全性の維持**: ジェネリクスを適切に使用してタイプセーフティを確保
5. **組み合わせて使用**: `compose`を使って複雑なバリデーションルールを構築

## APIルートでの実装例

### 2025年1月の実装

APIルートにて共通バリデーションフレームワークを適用し、以下の改善を実現しました：

#### 実装内容
- `api/src/validation/schemas.ts` に共通バリデーションスキーマを集約
- トランザクションAPIとサブスクリプションAPIで統一されたバリデーションを実装
- カテゴリIDバリデーターで文字列から数値への自動変換を追加

#### 改善効果
- **コード削減**: 約80-100行の重複コードを削除
- **一貫性向上**: すべてのAPIで同じバリデーションルールを適用
- **エラーメッセージ統一**: 日本語の統一されたエラーメッセージ
- **型安全性**: TypeScriptの型システムを活用

#### 実装例
```typescript
// api/src/validation/schemas.ts
export const categoryIdValidator: Validator<number | string | null | undefined> = (
  value,
  fieldName
) => {
  if (value === null || value === undefined) return null;
  
  // 文字列の場合は数値に変換
  const numericValue = typeof value === 'string' ? Number(value) : value;
  
  if (isNaN(numericValue)) {
    return {
      field: fieldName,
      message: 'カテゴリIDは数値である必要があります',
      code: 'INVALID_TYPE',
    };
  }
  
  return positiveNumber('カテゴリIDは正の整数である必要があります')(numericValue, fieldName);
};
```

## 今後の拡張

このフレームワークは、今後以下の機能で拡張可能です：

- 非同期バリデーション（データベースチェックなど）
- 条件付きバリデーション（他のフィールドに依存）
- 国際化対応（多言語エラーメッセージ）
- より高度なバリデーター（メールアドレス、URL、電話番号など）