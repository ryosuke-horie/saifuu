/**
 * ナビゲーションカードコンポーネント
 *
 * ダッシュボードから各機能へのナビゲーションを提供する
 * 再利用可能なカードコンポーネント
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";

interface NavigationCardProps {
	/** リンク先のURL */
	href: string;
	/** カードのアイコン（絵文字など） */
	icon: ReactNode;
	/** カードのタイトル */
	title: string;
	/** カードの説明文 */
	description: string;
	/** 追加のCSSクラス */
	className?: string;
}

export const NavigationCard = ({
	href,
	icon,
	title,
	description,
	className = "",
}: NavigationCardProps) => {
	return (
		<Link
			href={href}
			className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${className}`}
		>
			<div className="flex items-center justify-between mb-4">
				<span className="text-4xl">{icon}</span>
				<ChevronRightIcon />
			</div>
			<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
			<p className="text-sm text-gray-600 mt-2">{description}</p>
		</Link>
	);
};
