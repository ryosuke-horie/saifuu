# 収入・支出コンポーネントの共通化リファクタリング計画

## 概要

収入（Income）と支出（Expense）のコンポーネントには多くの重複コードが存在するため、これらを共通化してコードの重複を削減する計画です。

## 現在の状況

### 完了した作業

1. **共通型定義の作成**
   - `/frontend/src/types/transaction.ts` - 収入・支出共通の型定義
   - `Transaction`, `TransactionFormData`, `TransactionListProps`などの共通型を定義

2. **共通サービスクラスの作成**
   - `/frontend/src/services/TransactionService.ts` - 共通処理を提供するサービスクラス
   - バリデーション、フォーマット、統計計算などの共通ロジックを集約

3. **共通コンポーネントの作成（未完成）**
   - `/frontend/src/components/transactions/TransactionForm.tsx` - 共通フォームコンポーネント
   - `/frontend/src/components/transactions/TransactionList.tsx` - 共通リストコンポーネント
   - `/frontend/src/hooks/useTransactions.ts` - 共通カスタムフック

### 未解決の問題

1. **依存関係の不足**
   - 共通コンポーネントが依存している以下のUIライブラリが未導入：
     - `@hookform/resolvers/zod`
     - `@tanstack/react-query`
     - `sonner`
     - `lucide-react`
     - `@/components/ui/*` (shadcn/ui components)

2. **型の不整合**
   - 既存のAPIでは`categoryId`が`string`型
   - 新しい共通型では当初`number`型として定義（修正済み）

3. **インターフェースの違い**
   - 既存のフックと新しい共通フックのインターフェースが異なる
   - 既存コンポーネントのプロパティと新しい共通コンポーネントのプロパティが異なる

## リファクタリング計画

### フェーズ1: 準備作業（推奨）

1. **必要なライブラリのインストール**
   ```bash
   pnpm add @hookform/resolvers @tanstack/react-query sonner lucide-react
   ```

2. **UIコンポーネントライブラリの導入**
   - shadcn/uiまたは類似のコンポーネントライブラリの導入
   - または既存のUIコンポーネントを使用するように共通コンポーネントを修正

### フェーズ2: 共通コンポーネントの完成

1. **TransactionFormの修正**
   - 既存のUIコンポーネントを使用するように修正
   - または新しいUIライブラリを導入

2. **TransactionListの修正**
   - 既存のTransactionRowコンポーネントとの統合
   - テーブルコンポーネントの実装

3. **useTransactionsフックの完成**
   - React Queryの導入または既存のデータフェッチング方法への適応

### フェーズ3: 段階的な移行

1. **ラッパーコンポーネントの作成**（一時的な対応）
   - 既存のインターフェースを維持しながら内部で共通コンポーネントを使用
   - 後方互換性を保ちながら段階的に移行

2. **テストの追加**
   - 共通コンポーネントのユニットテスト
   - 既存機能が正しく動作することを確認するE2Eテスト

3. **段階的なリファクタリング**
   - まず新規画面から共通コンポーネントを使用
   - 既存画面は動作確認しながら順次移行

## 現在の対応状況

現時点では、共通コンポーネントが未完成で依存関係も解決していないため、以下の対応を実施：

1. **既存実装の維持**
   - `useIncomes`と`useExpenses`フックは既存の実装を維持
   - `IncomeForm`と`ExpenseForm`コンポーネントも既存の実装を維持
   - `IncomeList`と`ExpenseList`コンポーネントも既存の実装を維持

2. **将来の移行準備**
   - 共通型定義とサービスクラスは作成済み
   - 移行時に使用できるように準備

## 推奨事項

1. **優先順位の設定**
   - まずは動作する既存コードの維持を優先
   - 新機能開発時に共通化を検討

2. **段階的なアプローチ**
   - 一度にすべてを変更せず、小さな単位で移行
   - 各ステップでテストを実施

3. **技術選定の検討**
   - React Hook FormとZodの組み合わせが必要か検討
   - React Queryが本当に必要か検討
   - 既存のアプローチで十分な場合はそれを維持

## 次のステップ

1. プロジェクトの優先順位を確認
2. 必要なライブラリの導入を検討
3. 小さな部分から共通化を開始（例：バリデーションロジックのみ）
4. 成功したら徐々に範囲を拡大

## 参考資料

- [React Hook Form](https://react-hook-form.com/)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)