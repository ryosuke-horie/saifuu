# Zodバリデーション移行ガイド

## 概要

本ガイドは、既存のカスタムバリデーションフレームワークからZodライブラリへの移行手順を説明します。

## 移行戦略

### Phase 1: 並行実装（完了）
- ✅ Zodライブラリの導入
- ✅ Zodスキーマの実装
- ✅ 既存APIと並行してZod版APIルートの作成
- ✅ フロントエンドのZod対応コンポーネント作成

### Phase 2: 段階的切り替え（現在）
1. APIエントリポイントの切り替え
2. フロントエンドコンポーネントの切り替え
3. 既存バリデーションコードの削除

### Phase 3: 最終確認
- E2Eテストの実行
- パフォーマンステスト
- ドキュメント更新

## 切り替え手順

### 1. APIの切り替え

既存の`index.tsx`から`index-with-zod.tsx`への切り替え：

```typescript
// wrangler.toml
[build]
command = "npm run build"
[build.upload]
dir = "dist"
main = "dist/index-with-zod.js" # <- この行を変更
```

### 2. フロントエンドの切り替え

既存コンポーネントからZod版への切り替え：

```typescript
// 既存
import { ExpenseForm } from '@/components/expenses/ExpenseForm'

// Zod版に変更
import { ExpenseFormWithZod } from '@/components/expenses/ExpenseFormWithZod'
```

### 3. バリデーション関数の置き換え

#### API側

```typescript
// 既存
import { validateTransactionCreate } from '../validation/schemas'

// Zod版に変更
import { validateTransactionCreateWithZod } from '../validation/zod-validators'
```

#### フロントエンド側

```typescript
// 既存
import { validateAmount, validateDate } from '@/lib/validation/form-validation'

// Zod版に変更
import { validateExpenseFormWithZod } from '@/lib/validation/zod-validation'
```

## バリデーションルールの対応表

| 既存ルール | Zodスキーマ | 備考 |
|-----------|------------|------|
| validateAmount | z.number().min(1).max(10000000) | 金額の上限値は同一 |
| validateDate | z.string().regex(/^\d{4}-\d{2}-\d{2}$/) | ISO形式の日付 |
| validateStringLength | z.string().max(200) | 最大文字数は同一 |
| validateId | z.coerce.number().int().positive() | 文字列からの変換対応 |

## エラーメッセージの比較

既存とZodで同じ日本語エラーメッセージを維持：

- 必須項目: `{field}は必須です`
- 数値範囲: `{min}円以上である必要があります`
- 文字数制限: `{max}文字以内で入力してください`

## テスト戦略

### 1. 並行テスト期間
- 既存APIとZod版APIの両方でテスト実行
- レスポンスの一致を確認

### 2. 切り替え後のテスト
- 全ユニットテストの実行
- E2Eテストによる動作確認
- パフォーマンス計測

## ロールバック手順

問題が発生した場合のロールバック：

1. `wrangler.toml`のmainを`dist/index.js`に戻す
2. フロントエンドのインポートを既存コンポーネントに戻す
3. デプロイし直す

## 削除予定ファイル

移行完了後に削除するファイル：

- `/api/src/validation/schemas.ts`
- `/api/src/validation/index.ts`
- `/api/src/routes/transactions.ts`（Zod版に置き換え）
- `/api/src/routes/subscriptions.ts`（Zod版に置き換え）
- `/frontend/src/lib/validation/form-validation.ts`
- `/frontend/src/components/expenses/ExpenseForm.tsx`（Zod版に置き換え）
- `/shared/src/validation/index.ts`

## 注意事項

1. **後方互換性**: 移行期間中はAPIの後方互換性を維持
2. **エラーレスポンス形式**: 既存と同じ形式を維持
3. **型定義**: Zodの推論型を活用してTypeScriptの型安全性を向上

## トラブルシューティング

### Zodバージョンの不整合
- 現在はZod v3を使用（v4との互換性問題を回避）
- インポートパスは`zod`ではなく`zod/v3`を使用

### 型エラーが発生する場合
- `z.infer<typeof schema>`を使用して型を推論
- 既存の型定義との整合性を確認

### パフォーマンスの問題
- Zodのパースは初回のみ実行するよう最適化
- 大量データの場合はバッチ処理を検討