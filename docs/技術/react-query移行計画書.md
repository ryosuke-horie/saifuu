# React Query移行計画書

## 1. 概要

### 1.1 プロジェクトの現状

Saifuuプロジェクトでは、データフェッチングとキャッシュ管理のためにReact Query（TanStack Query）を部分的に導入しています。現在、主要なフックの約75%がReact Queryに移行済みですが、いくつかの重要なフックが未移行の状態です。

### 1.2 React Query採用の背景と利点

#### 採用背景
- **キャッシュ管理の複雑性**: 手動でのキャッシュ管理による不整合の発生
- **楽観的更新の実装困難**: 従来のfetchベースでは楽観的更新の実装が複雑
- **エラーハンドリングの分散**: 各フックで個別にエラー処理を実装
- **ローディング状態の管理**: 複数のローディング状態の管理が煩雑

#### 主な利点
- **宣言的なデータフェッチング**: useQueryとuseMutationによる直感的なAPI
- **自動キャッシュ管理**: staleTimeとgcTimeによる柔軟なキャッシュ戦略
- **楽観的更新の容易な実装**: onMutateコールバックによる即座のUI更新
- **統一されたエラーハンドリング**: QueryClientレベルでの一元管理
- **バックグラウンド再取得**: フォーカス時や定期的な自動更新

## 2. 現状分析

### 2.1 React Query実装済みフック（6つ）

#### 1. useIncomes（完全実装）
- **場所**: `/src/hooks/useIncomes.ts`
- **特徴**: 
  - 楽観的更新を完全実装（作成・更新・削除）
  - 一時的なIDを使用した新規作成時の楽観的更新
  - エラー時の自動ロールバック
- **クエリキー**: `["incomes"]`, `["income", id]`

#### 2. useExpenses（完全実装）
- **場所**: `/src/hooks/useExpenses.ts`
- **特徴**: 
  - useIncomesと同様の楽観的更新実装
  - 専用APIエンドポイント（getExpenseTransactions）使用
  - 完全なCRUD操作対応
- **クエリキー**: `["expenses"]`, `["expense", id]`

#### 3. useCategories
- **場所**: `/src/hooks/useCategories.ts`
- **特徴**: 
  - カテゴリ一覧の取得
  - カテゴリの作成・更新・削除
  - 型別フィルタリング機能
- **クエリキー**: `["categories", type]`

#### 4. useBalanceSummary
- **場所**: `/src/hooks/useBalanceSummary.ts`
- **特徴**: 
  - 収支バランスの集計データ取得
  - 自動再計算とキャッシュ
- **クエリキー**: `["balanceSummary"]`

#### 5. useTransactionStats
- **場所**: `/src/hooks/useTransactionStats.ts`
- **特徴**: 
  - 取引統計情報の取得
  - カテゴリ別・月別集計
- **クエリキー**: `["transactionStats", params]`

#### 6. useSubscriptions（部分実装）
- **場所**: `/src/lib/api/hooks/useSubscriptions.ts`
- **特徴**: 
  - 一覧取得と作成mutationのみ実装
  - 更新・削除mutationが未実装
  - アクティブ/非アクティブフィルタリング
- **クエリキー**: `["subscriptions", query]`, `["subscription", id]`

### 2.2 未移行フック（2つ）

#### 1. useTransactions（旧実装）
- **場所**: `/src/hooks/useTransactions.ts`
- **現状**: 
  - fetchベースの実装
  - 手動でのローディング・エラー管理
  - 楽観的更新なし
- **問題点**:
  - useIncomes/useExpensesとの重複ロジック
  - キャッシュ管理の欠如
  - エラーハンドリングの不統一

#### 2. useIncomesWithPagination（独自実装）
- **場所**: `/src/hooks/useIncomesWithPagination.ts`
- **現状**: 
  - 独自のページネーション実装
  - URL同期機能を含む
  - apiClientを直接使用
- **特徴**:
  - URL パラメータとの同期
  - ソート機能の実装
  - カスタムページネーション状態管理

### 2.3 QueryProviderの設定

- **staleTime**: 0ms（常に新鮮なデータを取得）
- **gcTime**: 5分（300,000ms）
- **refetchOnWindowFocus**: false
- **retry**: 1回
- **retryDelay**: 指数バックオフ（最大30秒）

## 3. 移行計画

### 3.1 useTransactionsの移行方針

#### 分析
- useIncomes/useExpensesと機能が重複
- 統合型のトランザクション管理として再設計が必要

#### 移行戦略
```typescript
// Option 1: 既存のuseIncomes/useExpensesを統合
export function useTransactions(type?: TransactionType) {
  const incomes = useIncomes();
  const expenses = useExpenses();
  
  if (type === 'income') return incomes;
  if (type === 'expense') return expenses;
  
  // 両方を統合した結果を返す
  return {
    transactions: [...incomes.incomes, ...expenses.expenses],
    // ... 統合ロジック
  };
}

// Option 2: 新規実装（推奨）
export function useTransactions(type?: TransactionType) {
  return useQuery({
    queryKey: ['transactions', { type }],
    queryFn: () => getTransactions({ type }),
    ...CACHE_CONFIG,
  });
}
```

#### 実装手順
1. 既存コードの使用箇所を調査
2. 型定義の統一（Transaction型の確認）
3. React Query版の実装
4. テストの作成
5. 段階的な置き換え

### 3.2 useIncomesWithPaginationの移行方針

#### 分析
- URL同期機能が重要な要件
- ページネーション状態の管理が複雑
- useInfiniteQueryが最適な選択

#### 移行戦略
```typescript
export function useIncomesWithPagination(params: UsePaginationParams) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['incomes', 'paginated', params],
    queryFn: ({ pageParam = 1 }) => 
      apiClient.transactions.list({
        type: 'income',
        page: pageParam,
        limit: params.itemsPerPage,
        sort: params.sortBy,
        order: params.sortOrder,
      }),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined,
    ...CACHE_CONFIG,
  });

  // URL同期ロジックの維持
  useEffect(() => {
    if (params.syncWithUrl) {
      updateUrlWithParams({ /* ... */ });
    }
  }, [/* 依存配列 */]);

  return {
    incomes: data?.pages.flatMap(page => page.data) ?? [],
    // ... その他の戻り値
  };
}
```

#### 実装手順
1. useInfiniteQueryのパターン調査
2. URL同期機能の抽出とカスタムフック化
3. ページネーション状態のReact Query移行
4. 既存インターフェースとの互換性維持
5. テストケースの更新

### 3.3 useSubscriptionsの機能拡張

#### 必要な追加実装
```typescript
// 更新mutation
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionRequest }) =>
    subscriptionService.updateSubscription(id, data),
  onMutate: async ({ id, data }) => {
    // 楽観的更新
    await queryClient.cancelQueries({ queryKey: ['subscriptions'] });
    const previous = queryClient.getQueryData(['subscriptions']);
    
    queryClient.setQueryData(['subscriptions'], (old) => {
      // 更新ロジック
    });
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // ロールバック
    if (context?.previous) {
      queryClient.setQueryData(['subscriptions'], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  },
});

// 削除mutation
const deleteMutation = useMutation({
  mutationFn: (id: string) => subscriptionService.deleteSubscription(id),
  // 同様の楽観的更新パターン
});
```

## 4. 実装ガイドライン

### 4.1 楽観的更新の実装パターン（useIncomes参考）

```typescript
const createMutation = useMutation({
  mutationFn: (data) => createResource(data),
  onMutate: async (data) => {
    // 1. 進行中のクエリをキャンセル
    await queryClient.cancelQueries({ queryKey: ['resources'] });
    
    // 2. 現在のデータを保存（ロールバック用）
    const previousData = queryClient.getQueryData(['resources']);
    
    // 3. 楽観的更新（一時IDを使用）
    const tempId = `temp-${Date.now()}`;
    const optimisticData = { id: tempId, ...data };
    
    queryClient.setQueryData(['resources'], (old) => {
      return [...(old || []), optimisticData];
    });
    
    // 4. コンテキストを返す
    return { previousData, tempId };
  },
  onSuccess: (newData, variables, context) => {
    // 5. 一時データを実データに置き換え
    queryClient.setQueryData(['resources'], (old) => {
      return old?.map(item => 
        item.id === context.tempId ? newData : item
      );
    });
  },
  onError: (err, variables, context) => {
    // 6. エラー時はロールバック
    if (context?.previousData) {
      queryClient.setQueryData(['resources'], context.previousData);
    }
  },
  onSettled: () => {
    // 7. 最終的にデータを再取得
    queryClient.invalidateQueries({ queryKey: ['resources'] });
  },
});
```

### 4.2 エラーハンドリングの統一

```typescript
// グローバルエラーハンドラー（QueryProvider）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 404は再試行しない
        if (error?.status === 404) return false;
        // その他は1回まで再試行
        return failureCount < 1;
      },
    },
    mutations: {
      onError: (error) => {
        // 統一エラー通知
        console.error('Mutation error:', error);
        // トースト表示など
      },
    },
  },
});

// フック内でのエラー整形
const formattedError = error
  ? error instanceof Error
    ? error.message
    : 'デフォルトエラーメッセージ'
  : null;
```

### 4.3 キャッシュ戦略（キー設計、無効化タイミング）

#### キー設計原則
```typescript
// 階層的なキー構造
const QUERY_KEYS = {
  transactions: ['transactions'] as const,
  transactionList: (filters: any) => ['transactions', 'list', filters] as const,
  transactionDetail: (id: string) => ['transactions', 'detail', id] as const,
};

// 関連データの無効化
queryClient.invalidateQueries({ 
  queryKey: ['transactions'], // すべてのtransaction関連クエリを無効化
});
```

#### 無効化タイミング
- **作成成功時**: リスト・統計データを無効化
- **更新成功時**: 個別データ・リスト・統計データを無効化
- **削除成功時**: すべての関連データを無効化
- **エラー時**: 楽観的更新のロールバック後に無効化

### 4.4 型安全性の確保（Matt Pocock方針）

```typescript
// 1. クエリキーの型安全性
const QUERY_KEYS = {
  todos: ['todos'],
  todo: (id: string) => ['todos', id],
} as const;

// 2. ジェネリクスの活用
function useApiQuery<TData>(
  key: readonly unknown[],
  fetcher: () => Promise<TData>,
) {
  return useQuery<TData, Error>({
    queryKey: key,
    queryFn: fetcher,
  });
}

// 3. 戻り値の型定義
interface UseResourceReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 4. satisfies演算子の活用
return {
  // ... 実装
} satisfies UseResourceReturn<Resource>;
```

## 5. ロードマップ（3フェーズ）

### Phase 1: 未移行フックの移行（1-2週間）

#### Week 1
- [ ] useTransactionsの移行
  - [ ] 使用箇所の調査（1日）
  - [ ] 実装方針の決定（1日）
  - [ ] React Query版実装（2日）
  - [ ] テスト作成（1日）

#### Week 2
- [ ] useIncomesWithPaginationの移行
  - [ ] useInfiniteQueryパターン調査（1日）
  - [ ] URL同期機能の分離（1日）
  - [ ] 実装とテスト（3日）

### Phase 2: 既存実装の最適化（1週間）

- [ ] useSubscriptionsの完全実装
  - [ ] 更新mutationの追加（1日）
  - [ ] 削除mutationの追加（1日）
  - [ ] 楽観的更新の実装（1日）
- [ ] 共通パターンの抽出
  - [ ] カスタムフックの作成（1日）
  - [ ] エラーハンドリングの統一（1日）

### Phase 3: 高度な機能の実装（2週間）

#### Week 1
- [ ] 高度なキャッシュ戦略
  - [ ] プリフェッチング実装
  - [ ] キャッシュウォーミング
  - [ ] 依存関係のあるクエリの最適化

#### Week 2
- [ ] パフォーマンス最適化
  - [ ] バンドルサイズの最適化
  - [ ] 不要な再レンダリングの削減
  - [ ] メモリリークの検査
- [ ] 開発者体験の向上
  - [ ] React Query Devtoolsの活用
  - [ ] デバッグユーティリティの作成

## 6. 期待される効果とメトリクス

### 6.1 パフォーマンス改善

#### 現状の課題
- 重複したAPIコール
- 手動キャッシュによるメモリ使用量増加
- ローディング状態の遅延

#### 期待される改善
- **APIコール削減**: 30-50%削減（キャッシュヒット率向上）
- **初期ローディング時間**: 20-30%短縮（楽観的更新）
- **メモリ使用量**: 最適化されたガベージコレクション

#### 測定方法
```typescript
// React Query Devtoolsでの監視
// - キャッシュヒット率
// - クエリ実行回数
// - 平均レスポンス時間

// カスタムメトリクス
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data) => {
        // パフォーマンス計測
        performance.mark('query-success');
      },
    },
  },
});
```

### 6.2 コード量削減

#### 現状
- 各フックで独自のローディング・エラー管理: 約50行/フック
- 手動キャッシュ管理: 約100行
- エラーハンドリング: 約30行/フック

#### 移行後
- React Queryによる自動管理: 約20行/フック
- 削減率: 約60-70%

### 6.3 保守性向上

#### 定量的指標
- **バグ発生率**: エラーハンドリング統一により50%削減見込み
- **開発速度**: 新規フック作成時間を30-40%短縮
- **テスト容易性**: モック作成の簡略化により50%効率化

#### 定性的効果
- 一貫性のあるデータフェッチングパターン
- 予測可能なキャッシュ動作
- 開発者の認知負荷軽減

## 7. リスクと対策

### 7.1 移行リスク

#### 破壊的変更のリスク
- **対策**: 段階的移行と後方互換性の維持
- **実装**: アダプターパターンによる既存インターフェース維持

#### パフォーマンス劣化
- **対策**: 移行前後でのベンチマーク実施
- **監視**: React Query Devtoolsとカスタムメトリクス

### 7.2 学習コスト
- **対策**: 
  - 内部勉強会の実施
  - ベストプラクティスドキュメントの作成
  - ペアプログラミングによる知識共有

## 8. 参考資料

### 公式ドキュメント
- [TanStack Query v5 Documentation](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

### 関連ファイル
- `/src/hooks/useIncomes.ts` - 楽観的更新の参考実装
- `/src/components/providers/QueryProvider.tsx` - 現在の設定
- `/docs/技術スタック.md` - プロジェクト全体の技術選定

### 内部ADR
- 今後作成予定: `ADR-003: React Query完全移行の決定`

---

**作成日**: 2025年1月
**作成者**: Documentation Writer Agent
**レビュー**: 未実施
**更新履歴**: 
- 2025-01-XX: 初版作成