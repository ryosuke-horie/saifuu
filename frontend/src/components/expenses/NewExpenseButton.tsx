"use client";

import type { FC } from "react";

interface NewExpenseButtonProps {
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
}

/**
 * 新規支出登録ボタンコンポーネント
 *
 * 支出管理画面で新規登録を開始するためのボタン
 *
 * 設計方針:
 * - 視認性の高いプライマリボタンデザイン
 * - アクセシビリティを考慮したボタン実装
 * - 将来の機能拡張を考慮したインターフェース設計
 * - レスポンシブ対応
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

export const NewExpenseButton: FC<NewExpenseButtonProps> = ({
	onClick,
	disabled = false,
	className = "",
}) => {
	const handleClick = () => {
		if (onClick) {
			onClick();
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			className={`
				inline-flex items-center px-4 py-2 border border-transparent
				text-sm font-medium rounded-md shadow-sm text-white
				bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
				focus:ring-offset-2 focus:ring-blue-500 transition-colors
				disabled:opacity-50 disabled:cursor-not-allowed
				disabled:hover:bg-blue-600
				${className}
			`}
			aria-label="新しい支出を登録"
		>
			{/* プラスアイコン */}
			<svg
				className="-ml-1 mr-2 h-4 w-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 6v6m0 0v6m0-6h6m-6 0H6"
				/>
			</svg>
			新規登録
		</button>
	);
};
