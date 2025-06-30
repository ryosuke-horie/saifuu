"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

/**
 * Headerコンポーネント
 *
 * アプリケーション全体のヘッダーコンポーネント
 * - アプリケーションタイトル表示
 * - レスポンシブデザイン対応
 * - セマンティックHTMLの使用によるアクセシビリティ確保
 *
 * 設計方針:
 * - シンプルで再利用可能な設計
 * - 家計管理アプリに適したミニマルなデザイン
 * - モバイルファーストなレスポンシブ対応
 */

interface HeaderProps {
	/**
	 * アプリケーションタイトル
	 * デフォルト: "Saifuu"
	 */
	title?: string;
	/**
	 * 追加のCSSクラス名
	 * カスタムスタイリングが必要な場合に使用
	 */
	className?: string;
}

export const Header: FC<HeaderProps> = ({
	title = "Saifuu",
	className = "",
}) => {
	const pathname = usePathname();

	// ナビゲーションアイテムの定義
	const navigationItems = [
		{ href: "/", label: "ホーム", icon: "🏠" },
		{ href: "/subscriptions", label: "サブスク管理", icon: "📱" },
	];
	return (
		<header
			className={[
				// 基本レイアウト
				"sticky top-0 z-50",
				"w-full",
				"border-b border-gray-200",

				// 背景
				"bg-white/80",
				"backdrop-blur-md",

				// 影効果
				"shadow-sm",

				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* ロゴ・タイトル部分 */}
					<div className="flex items-center space-x-3">
						{/* ロゴプレースホルダー */}
						<div
							className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
							role="img"
							aria-label="Saifuuロゴ"
						>
							<span className="text-white font-bold text-sm">¥</span>
						</div>

						{/* アプリケーションタイトル */}
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-sans">
							{title}
						</h1>
					</div>

					{/* ナビゲーション */}
					<nav
						className="flex items-center space-x-1 sm:space-x-2"
						aria-label="メインナビゲーション"
					>
						{navigationItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={[
										// 基本スタイル
										"flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
										"hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
										// アクティブ状態
										isActive
											? "bg-blue-100 text-blue-700"
											: "text-gray-600 hover:text-gray-900",
									].join(" ")}
									aria-current={isActive ? "page" : undefined}
								>
									<span className="text-lg" aria-hidden="true">
										{item.icon}
									</span>
									<span className="hidden sm:inline">{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>
			</div>
		</header>
	);
};

/**
 * デフォルトエクスポート
 * 他のコンポーネントから簡単にインポートできるように提供
 */
export default Header;
