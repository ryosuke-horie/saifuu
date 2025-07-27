/**
 * ナビゲーション関連の定数定義
 *
 * ダッシュボードのナビゲーションカードで使用する
 * 定数データを管理
 */

import type { ReactNode } from "react";

// ナビゲーションアイテムの型定義
export interface NavigationItem {
	id: string;
	href: string;
	icon: ReactNode;
	title: string;
	description: string;
}

// ダッシュボードのナビゲーションアイテム
export const DASHBOARD_NAVIGATION_ITEMS = [
	{
		id: "expenses",
		href: "/expenses",
		icon: "💸",
		title: "支出管理",
		description: "支出の記録と管理",
	},
	{
		id: "income",
		href: "/income",
		icon: "💰",
		title: "収入管理",
		description: "収入の記録と管理",
	},
	{
		id: "subscriptions",
		href: "/subscriptions",
		icon: "📱",
		title: "サブスクリプション管理",
		description: "定期支払いの管理",
	},
] as const satisfies readonly NavigationItem[];
