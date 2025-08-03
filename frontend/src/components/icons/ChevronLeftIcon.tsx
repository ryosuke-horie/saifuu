/**
 * 左矢印アイコンコンポーネント
 *
 * ナビゲーション要素で使用される左向きのシェブロンアイコン
 */

interface ChevronLeftIconProps {
	/** アイコンのCSSクラス */
	className?: string;
}

export const ChevronLeftIcon = ({
	className = "w-6 h-6 text-gray-400",
}: ChevronLeftIconProps) => (
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
			d="M15 19l-7-7 7-7"
		/>
	</svg>
);
