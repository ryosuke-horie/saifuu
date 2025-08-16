/**
 * 収入管理ページのレイアウトコンポーネント
 *
 * ページ全体の構造とレイアウトを管理
 * IncomePageContentから分離して責務を明確化
 */

import type React from "react";

interface IncomePageLayoutProps {
	children: React.ReactNode;
}

export const IncomePageLayout: React.FC<IncomePageLayoutProps> = ({
	children,
}) => {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">収入管理</h1>
			{children}
		</div>
	);
};
