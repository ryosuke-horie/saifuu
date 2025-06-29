import type { FC } from "react";

/**
 * Headerコンポーネント
 *
 * アプリケーション全体のヘッダーコンポーネント
 * - アプリケーションタイトル表示
 * - レスポンシブデザイン対応
 * - ダークモード対応
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
	return (
		<header
			className={[
				// 基本レイアウト
				"sticky top-0 z-50",
				"w-full",
				"border-b border-gray-200 dark:border-gray-800",

				// 背景とテーマ対応
				"bg-white/80 dark:bg-gray-900/80",
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
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-sans">
							{title}
						</h1>
					</div>

					{/* 将来的なナビゲーション・ユーザーメニュー用の領域 */}
					<nav
						className="flex items-center space-x-4"
						aria-label="メインナビゲーション"
					>
						{/* 現在は空 - 将来的にメニューボタン、ユーザーアイコン等を配置 */}
						<div className="flex items-center">
							{/* プレースホルダー: メニューボタンなど */}
						</div>
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
