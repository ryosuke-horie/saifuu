import type { FC } from "react";
import type {
	Subscription,
	SubscriptionListProps,
} from "../../types/subscription";

/**
 * サブスクリプション一覧コンポーネント
 *
 * サブスクリプションデータをテーブル形式で表示する
 * レスポンシブデザインに対応し、モバイルではカード形式に切り替わる
 *
 * 設計方針:
 * - データの視認性を重視したテーブルレイアウト
 * - モバイルファーストなレスポンシブ対応
 * - ローディング・エラー状態の適切な表示
 * - アクセシビリティを考慮したセマンティックHTML
 */

/**
 * 単一のサブスクリプション行コンポーネント
 */
const SubscriptionRow: FC<{ subscription: Subscription }> = ({
	subscription,
}) => {
	// 料金を日本円形式でフォーマット
	const formatAmount = (amount: number): string => {
		return new Intl.NumberFormat("ja-JP", {
			style: "currency",
			currency: "JPY",
		}).format(amount);
	};

	// 請求サイクルを日本語に変換
	const formatBillingCycle = (cycle: string): string => {
		return cycle === "monthly" ? "月額" : "年額";
	};

	// カテゴリを日本語に変換
	const formatCategory = (category: string): string => {
		const categoryMap: Record<string, string> = {
			entertainment: "エンタメ",
			work: "仕事",
			lifestyle: "ライフスタイル",
			other: "その他",
		};
		return categoryMap[category] || category;
	};

	// 次回請求日をフォーマット
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
	};

	return (
		<tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
			<td className="px-4 py-3 text-sm font-medium text-gray-900">
				{subscription.name}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700">
				{formatAmount(subscription.amount)}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
				{formatBillingCycle(subscription.billingCycle)}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
				{formatCategory(subscription.category)}
			</td>
			<td className="px-4 py-3 text-sm text-gray-700">
				{formatDate(subscription.nextBillingDate)}
			</td>
		</tr>
	);
};

/**
 * ローディング状態の表示コンポーネント
 */
const LoadingState: FC = () => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
			<div className="flex items-center justify-center space-x-2">
				<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
				<span>読み込み中...</span>
			</div>
		</td>
	</tr>
);

/**
 * エラー状態の表示コンポーネント
 */
const ErrorState: FC<{ message: string }> = ({ message }) => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-red-600">
			<div className="flex items-center justify-center space-x-2">
				<span className="text-xl">⚠️</span>
				<span>エラー: {message}</span>
			</div>
		</td>
	</tr>
);

/**
 * 空状態の表示コンポーネント
 */
const EmptyState: FC = () => (
	<tr>
		<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
			<div className="flex flex-col items-center space-y-2">
				<span className="text-3xl">📋</span>
				<span>登録されているサブスクリプションがありません</span>
				<span className="text-sm text-gray-400">
					新規登録ボタンから追加してください
				</span>
			</div>
		</td>
	</tr>
);

/**
 * サブスクリプション一覧コンポーネント
 */
export const SubscriptionList: FC<SubscriptionListProps> = ({
	subscriptions,
	isLoading = false,
	error = null,
	className = "",
}) => {
	return (
		<div className={`bg-white rounded-lg shadow ${className}`}>
			{/* テーブルヘッダー */}
			<div className="px-4 py-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900">
					サブスクリプション一覧
				</h2>
				<p className="text-sm text-gray-600 mt-1">
					現在登録されているサブスクリプションサービス
				</p>
			</div>

			{/* テーブル本体 */}
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								サービス名
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								料金
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
							>
								請求サイクル
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
							>
								カテゴリ
							</th>
							<th
								scope="col"
								className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								次回請求日
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{isLoading && <LoadingState />}
						{error && <ErrorState message={error} />}
						{!isLoading && !error && subscriptions.length === 0 && (
							<EmptyState />
						)}
						{!isLoading &&
							!error &&
							subscriptions.map((subscription) => (
								<SubscriptionRow
									key={subscription.id}
									subscription={subscription}
								/>
							))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
