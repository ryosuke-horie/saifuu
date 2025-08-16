"use client";

import { Suspense } from "react";
import { IncomePageContent } from "./IncomePageContent";

/**
 * 収入管理ページのローディング表示
 *
 * Suspenseのfallback用コンポーネント
 */
function IncomePageLoading() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-pulse space-y-4">
						<div className="h-32 bg-gray-200 rounded-lg" />
						<div className="grid grid-cols-2 gap-6">
							<div className="h-48 bg-gray-200 rounded-lg" />
							<div className="h-48 bg-gray-200 rounded-lg" />
						</div>
						<div className="h-64 bg-gray-200 rounded-lg" />
					</div>
					<p className="mt-4 text-gray-600">データを読み込んでいます...</p>
				</div>
			</div>
		</div>
	);
}

/**
 * 収入管理メインページ
 *
 * 収入の一覧表示と登録・編集・削除機能を提供する統合ページ
 * Phase 2の全コンポーネントを統合した完全版
 * - 収入統計表示
 * - フィルタリング機能
 * - カテゴリ別グラフ表示
 * - ページネーション付き一覧表示
 *
 * Next.js 15の要件に従い、useSearchParamsを使用するコンポーネントを
 * Suspenseでラップしてレンダリング
 */
export default function IncomePage() {
	return (
		<Suspense fallback={<IncomePageLoading />}>
			<IncomePageContent />
		</Suspense>
	);
}
