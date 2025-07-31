// 編集用アイコンコンポーネント
// トランザクション編集などで使用

interface PencilIconProps {
	className?: string;
	size?: number;
}

export function PencilIcon({ className = "", size = 16 }: PencilIconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
		</svg>
	);
}
