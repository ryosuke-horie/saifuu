/**
 * 右矢印アイコンコンポーネント
 *
 * ナビゲーション要素で使用される右向きのシェブロンアイコン
 */

interface ChevronRightIconProps {
	/** アイコンのCSSクラス */
	className?: string;
}

export const ChevronRightIcon = ({
	className = "w-6 h-6 text-gray-400",
}: ChevronRightIconProps) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 5l7 7-7 7"
		/>
	</svg>
);
