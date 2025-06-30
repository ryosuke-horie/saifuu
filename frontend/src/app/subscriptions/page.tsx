"use client";

import type { FC } from "react";
import { useCallback, useState } from "react";
import { mockSubscriptions } from "../../../.storybook/mocks/data/subscriptions";
import {
	NewSubscriptionButton,
	NewSubscriptionDialog,
	SubscriptionList,
} from "../../components/subscriptions";
import type {
	Subscription,
	SubscriptionFormData,
} from "../../types/subscription";

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
	// サブスクリプションデータの状態管理
	// 現在はモックデータを使用、将来的にはAPIやstateから取得予定
	const [subscriptions, setSubscriptions] =
		useState<Subscription[]>(mockSubscriptions);

	// ダイアログの状態管理
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// ダイアログを開く
	const handleOpenDialog = useCallback(() => {
		setIsDialogOpen(true);
	}, []);

	// ダイアログを閉じる
	const handleCloseDialog = useCallback(() => {
		setIsDialogOpen(false);
		setIsSubmitting(false);
	}, []);

	// 新規サブスクリプション登録処理
	const handleSubmitNewSubscription = useCallback(
		async (data: SubscriptionFormData) => {
			setIsSubmitting(true);

			try {
				// 新しいサブスクリプションデータを作成
				const newSubscription: Subscription = {
					id: `sub_${Date.now()}`, // 簡易的なID生成（実際のプロダクションではUUIDなどを使用）
					...data,
				};

				// モックデータに追加（実際のプロダクションではAPI呼び出し）
				setSubscriptions((prev) => [newSubscription, ...prev]);

				// 成功フィードバック（将来的にはトーストやスナックバーなどを使用）
				console.log("新しいサブスクリプションを登録しました:", newSubscription);

				// ダイアログを閉じる
				handleCloseDialog();
			} catch (error) {
				console.error("サブスクリプション登録エラー:", error);
				// エラーハンドリング（将来的にはエラーメッセージ表示）
			} finally {
				setIsSubmitting(false);
			}
		},
		[handleCloseDialog],
	);

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
										{subscriptions.length}
									</span>
								</div>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-500">
									登録サービス数
								</p>
								<p className="text-lg font-semibold text-gray-900">
									{subscriptions.length} サービス
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
									¥
									{subscriptions
										.reduce((sum, sub) => sum + sub.amount, 0)
										.toLocaleString()}
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
									{subscriptions.length > 0
										? new Date(
												Math.min(
													...subscriptions.map((s) =>
														new Date(s.nextBillingDate).getTime(),
													),
												),
											).toLocaleDateString("ja-JP", {
												month: "short",
												day: "numeric",
											})
										: "---"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* サブスクリプション一覧 */}
				<SubscriptionList
					subscriptions={subscriptions}
					isLoading={false}
					error={null}
				/>
			</main>

			{/* 新規サブスクリプション登録ダイアログ */}
			<NewSubscriptionDialog
				isOpen={isDialogOpen}
				onClose={handleCloseDialog}
				onSubmit={handleSubmitNewSubscription}
				isSubmitting={isSubmitting}
			/>
		</div>
	);
};

export default SubscriptionsPage;
