# マイグレーション 0003_add_income_type ロールバック手順

## 概要
このドキュメントでは、`transactions`テーブルのtype列に'income'を追加するマイグレーションのロールバック手順を説明します。

## ロールバック手順

### 1. データの確認
ロールバック前に、収入タイプのデータが存在するか確認します：

```sql
SELECT COUNT(*) FROM transactions WHERE type = 'income';
```

### 2. 収入データのバックアップ（必要な場合）
収入データが存在する場合は、事前にバックアップを取得します：

```sql
-- 収入データをCSVエクスポート（SQLiteの場合）
.mode csv
.output income_backup.csv
SELECT * FROM transactions WHERE type = 'income';
.output stdout
```

### 3. ロールバックSQLの実行

```sql
-- ロールバック: typeカラムをexpenseのみに戻す
PRAGMA foreign_keys=OFF;

CREATE TABLE `__rollback_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`type` text CHECK(`type` IN ('expense')) NOT NULL,
	`category_id` integer,
	`description` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

-- expenseデータのみを移行（incomeデータは除外）
INSERT INTO `__rollback_transactions`("id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at") 
SELECT "id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at" 
FROM `transactions` 
WHERE `type` = 'expense';

DROP TABLE `transactions`;
ALTER TABLE `__rollback_transactions` RENAME TO `transactions`;

PRAGMA foreign_keys=ON;
```

### 4. スキーマファイルの更新
`api/src/db/schema.ts`のtype定義を元に戻します：

```typescript
// 変更前
type: text('type', { enum: ['expense', 'income'] }).notNull(),

// 変更後（ロールバック）
type: text('type', { enum: ['expense'] }).notNull(),
```

### 5. ジャーナルファイルの更新
`api/drizzle/migrations/meta/_journal.json`から該当エントリを削除：

```json
// 以下のエントリを削除
{
  "idx": 3,
  "version": "6",
  "when": 1753600000000,
  "tag": "0003_add_income_type",
  "breakpoints": true
}
```

## 注意事項

1. **データ損失の警告**: ロールバックを実行すると、すべての収入（income）タイプのトランザクションデータが削除されます。必ず事前にバックアップを取得してください。

2. **依存関係の確認**: 他のコードが'income'タイプに依存していないか確認してください（API、フロントエンドなど）。

3. **開発環境での検証**: 本番環境でロールバックする前に、必ず開発環境で手順を検証してください。

## 開発環境でのロールバック実行例

```bash
# 1. 現在のDBをバックアップ
cp dev.db dev.db.before_rollback

# 2. SQLiteでロールバックSQLを実行
sqlite3 dev.db < rollback_0003.sql

# 3. スキーマファイルを更新
# (手動でschema.tsを編集)

# 4. 型チェックとテストを実行
pnpm run check:fix
```