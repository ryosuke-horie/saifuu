"use client";

import { ErrorSection } from "../components/dashboard/ErrorSection";
import { NavigationCard } from "../components/dashboard/NavigationCard";
import { SubscriptionSummaryCard } from "../components/dashboard/SubscriptionSummaryCard";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { DASHBOARD_NAVIGATION_ITEMS } from "../constants/navigation";
import { useExpenseStats } from "../hooks/useExpenseStats";
import { useExpenses } from "../hooks/useExpenses";
import { useIncomeStats } from "../hooks/useIncomeStats";
import { useIncomes } from "../hooks/useIncomes";
import { useSubscriptionStats } from "../lib/api/hooks/useSubscriptions";
import { formatCurrency } from "../lib/utils/format";

/**
 * ダッシュボードページコンポーネント
 *
 * アプリケーションのメインページ
 * 各種統計情報の表示と機能への導線を提供
 */
export default function Home() {
	// データ取得フック
	const {
		expenses,
		loading: expensesLoading,
		error: expensesError,
	} = useExpenses();
	const {
		incomes,
		loading: incomesLoading,
		error: incomesError,
	} = useIncomes();
	const { totalExpense, transactionCount: expenseCount } = useExpenseStats(
		expenses,
		expensesLoading,
	);
	const { totalIncome } = useIncomeStats(incomes, incomesLoading);
	const {
		stats: subscriptionStats,
		isLoading: subscriptionLoading,
		error: subscriptionError,
	} = useSubscriptionStats();

	// エラーメッセージの配列を構築
	const errors = [
		{ key: "expenses", message: expensesError },
		{ key: "incomes", message: incomesError },
		{ key: "subscriptions", message: subscriptionError },
	];

	return (
		<div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
			<h1 className="text-3xl font-bold text-gray-900 mb-8">ダッシュボード</h1>

			{/* エラー表示 */}
			<ErrorSection errors={errors} />

			{/* サマリーセクション */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				{/* 支出サマリー */}
				<SummaryCard
					title="今月の支出"
					value={formatCurrency(totalExpense)}
					subText={`${expenseCount}件`}
					valueColorClass="text-red-600"
					isLoading={expensesLoading}
				/>

				{/* 収入サマリー */}
				<SummaryCard
					title="今月の収入"
					value={formatCurrency(totalIncome)}
					valueColorClass="text-green-600"
					isLoading={incomesLoading}
				/>

				{/* サブスクリプションサマリー */}
				<SubscriptionSummaryCard
					stats={subscriptionStats?.stats}
					isLoading={subscriptionLoading}
				/>
			</div>

			{/* ナビゲーションカード */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{DASHBOARD_NAVIGATION_ITEMS.map((item) => (
					<NavigationCard
						key={item.id}
						href={item.href}
						icon={item.icon}
						title={item.title}
						description={item.description}
					/>
				))}
			</div>
		</div>
	);
}
