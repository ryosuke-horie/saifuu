"use client";

import type { FC } from "react";
import { useCallback, useState } from "react";
import {
	DeleteConfirmDialog,
	NewSubscriptionButton,
	NewSubscriptionDialog,
	SubscriptionList,
} from "../../components/subscriptions";
import {
	useCreateSubscription,
	useDeleteSubscription,
	useSubscriptions,
} from "../../lib/api/hooks/useSubscriptions";
import type {
	CreateSubscriptionRequest,
	SubscriptionFormData,
} from "../../lib/api/types";

/**
 * サブスクリプション管理ページ
 *
 * Issue #16: frontend>サブスク管理画面の実装
 * - 一覧画面を作成
 * - 新規登録ボタンを用意（UIのみ）
 *
 * 機能:
 * - サブスクリプション一覧の表示
 * - 新規登録ボタン（現在はUIのみ）
 * - レスポンシブデザイン対応
 *
 * 設計方針:
 * - シンプルで直感的なUI
 * - 家計管理アプリに適したデザイン
 * - モバイルファーストなレスポンシブ対応
 * - 将来の機能拡張を考慮した実装
 */

const SubscriptionsPage: FC = () => {
	// サブスクリプションデータの取得
	const {
		subscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
		refetch: refetchSubscriptions,
	} = useSubscriptions();

	// サブスクリプション作成用フック
	const {
		isLoading: operationLoading,
		createSubscription: createSubscriptionMutation,
	} = useCreateSubscription();

	// サブスクリプション削除用フック
	const {
		isLoading: deleteLoading,
		deleteSubscription: deleteSubscriptionMutation,
	} = useDeleteSubscription();

	// ダイアログの状態管理
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);

	// ダイアログを開く
	const handleOpenDialog = useCallback(() => {
		setIsDialogOpen(true);
	}, []);

	// ダイアログを閉じる
	const handleCloseDialog = useCallback(() => {
		setIsDialogOpen(false);
	}, []);

	// 新規サブスクリプション登録処理
	const handleSubmitNewSubscription = useCallback(
		async (data: SubscriptionFormData) => {
			try {
				// SubscriptionFormDataをCreateSubscriptionRequestに変換
				const requestData: CreateSubscriptionRequest = {
					...data,
					startDate: new Date().toISOString().split("T")[0], // 今日の日付を開始日とする
				};
				// API経由でサブスクリプションを作成
				const result = await createSubscriptionMutation(requestData);

				// 成功時のみダイアログを閉じる
				if (result) {
					handleCloseDialog();

					// サブスクリプション一覧を再取得
					await refetchSubscriptions();

					// 成功フィードバック（将来的にはトーストやスナックバーなどを使用）
					console.log("新しいサブスクリプションを登録しました");
				}
			} catch (error) {
				console.error("サブスクリプション登録エラー:", error);
				// エラーはフォーム内で表示されるため、ここでは特別な処理不要
			}
		},
		[createSubscriptionMutation, handleCloseDialog, refetchSubscriptions],
	);

	// 削除ダイアログを開く
	const handleOpenDeleteDialog = useCallback(
		(id: string) => {
			const targetSubscription = subscriptions.find((sub) => sub.id === id);
			if (targetSubscription) {
				setDeleteTargetId(id);
				setDeleteTargetName(targetSubscription.name);
				setIsDeleteDialogOpen(true);
			}
		},
		[subscriptions],
	);

	// 削除ダイアログを閉じる
	const handleCloseDeleteDialog = useCallback(() => {
		setIsDeleteDialogOpen(false);
		setDeleteTargetId(null);
		setDeleteTargetName(null);
	}, []);

	// サブスクリプション削除処理
	const handleDeleteSubscription = useCallback(async () => {
		if (!deleteTargetId) return;

		try {
			const success = await deleteSubscriptionMutation(deleteTargetId);
			if (success) {
				// 削除成功時はダイアログを閉じて一覧を再取得
				handleCloseDeleteDialog();
				await refetchSubscriptions();
				console.log("サブスクリプションを削除しました");
			}
		} catch (error) {
			console.error("サブスクリプション削除エラー:", error);
			// エラーハンドリングは削除フック側で実施されている
		}
	}, [
		deleteTargetId,
		deleteSubscriptionMutation,
		handleCloseDeleteDialog,
		refetchSubscriptions,
	]);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* メインコンテンツ */}
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* ページヘッダー */}
				<div className="mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
						<div className="mb-4 sm:mb-0">
							<h1 className="text-2xl font-bold text-gray-900">
								サブスクリプション管理
							</h1>
							<p className="text-sm text-gray-600 mt-1">
								定期購読サービスの管理と費用の把握
							</p>
						</div>

						{/* 新規登録ボタン */}
						<div className="flex-shrink-0">
							<NewSubscriptionButton onClick={handleOpenDialog} />
						</div>
					</div>
				</div>

				{/* 統計情報（将来実装予定） */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
									<span className="text-blue-600 text-sm font-medium">
										{subscriptionsLoading ? "..." : subscriptions.length}
									</span>
								</div>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">
									登録サービス数
								</p>
								<p className="text-lg font-semibold text-gray-900">
									{subscriptionsLoading
										? "読み込み中..."
										: `${subscriptions.length} サービス`}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
									<span className="text-green-600 text-sm">¥</span>
								</div>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">月間合計</p>
								<p className="text-lg font-semibold text-gray-900">
									{subscriptionsLoading
										? "読み込み中..."
										: `¥${subscriptions
												.filter((sub) => sub.isActive)
												.reduce((sum, sub) => {
													// 月額換算に統一
													const monthlyAmount =
														sub.billingCycle === "yearly"
															? sub.amount / 12
															: sub.amount;
													return sum + monthlyAmount;
												}, 0)
												.toLocaleString("ja-JP")}`}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
									<span className="text-yellow-600 text-sm">📅</span>
								</div>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">次回請求</p>
								<p className="text-lg font-semibold text-gray-900">
									{subscriptionsLoading
										? "読み込み中..."
										: (() => {
												const activeSubscriptions = subscriptions.filter(
													(s) => s.isActive,
												);
												if (activeSubscriptions.length === 0) return "---";

												// 最も早い次回請求日を見つける（タイムゾーンに依存しない方法）
												const nextBillingDates = activeSubscriptions.map(
													(s) => s.nextBillingDate,
												);
												const validDates = nextBillingDates.filter(
													(date): date is string => date != null,
												);
												if (validDates.length === 0) return "---";
												const earliestDate = validDates.sort()[0];

												// ISO文字列から月日を抽出
												const datePart = earliestDate.split("T")[0];
												if (!datePart) return "---";

												const [, month, day] = datePart.split("-");
												if (!month || !day) return "---";

												// 月日を表示（例: "1月15日"）
												return `${Number.parseInt(month, 10)}月${Number.parseInt(day, 10)}日`;
											})()}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* エラーメッセージ表示 */}
				{subscriptionsError && (
					<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
						<div className="flex">
							<div className="flex-shrink-0">
								<span className="text-red-400">⚠️</span>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-red-800">
									データの読み込みに失敗しました
								</h3>
								<div className="mt-2 text-sm text-red-700">
									<p>{subscriptionsError}</p>
								</div>
								<div className="mt-4">
									<div className="flex space-x-3">
										<button
											type="button"
											onClick={() => {
												refetchSubscriptions();
											}}
											className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors"
										>
											再試行
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* サブスクリプション一覧 */}
				<SubscriptionList
					subscriptions={subscriptions}
					isLoading={subscriptionsLoading}
					error={subscriptionsError}
					onDelete={handleOpenDeleteDialog}
				/>
			</main>

			{/* 新規サブスクリプション登録ダイアログ */}
			<NewSubscriptionDialog
				isOpen={isDialogOpen}
				onClose={handleCloseDialog}
				onSubmit={handleSubmitNewSubscription}
				isSubmitting={operationLoading}
			/>

			{/* サブスクリプション削除確認ダイアログ */}
			<DeleteConfirmDialog
				isOpen={isDeleteDialogOpen}
				onClose={handleCloseDeleteDialog}
				onConfirm={handleDeleteSubscription}
				subscriptionName={deleteTargetName || undefined}
				isDeleting={deleteLoading}
			/>
		</div>
	);
};

export default SubscriptionsPage;
