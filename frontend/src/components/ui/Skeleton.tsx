import type { CSSProperties, FC } from "react";

export interface SkeletonProps {
	variant?: "text" | "rectangular" | "circular";
	width?: string | number;
	height?: string | number;
	className?: string;
	count?: number;
}

const variantClasses = {
	text: "h-4 rounded",
	rectangular: "rounded-md",
	circular: "rounded-full",
} as const;

export const Skeleton: FC<SkeletonProps> = ({
	variant = "rectangular",
	width,
	height,
	className = "",
	count = 1,
}) => {
	const variantClass = variantClasses[variant];

	const style: CSSProperties = {};
	if (width) {
		style.width = typeof width === "number" ? `${width}px` : width;
	}
	if (height) {
		style.height = typeof height === "number" ? `${height}px` : height;
	}

	if (count > 1) {
		return (
			<div className="space-y-2">
				{Array.from({ length: count }).map((_, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: countは固定値であり、配列の順序は変わらない
						key={`skeleton-${index}`}
						className={`animate-pulse bg-gray-200 ${variantClass} ${
							index === count - 1 ? "w-4/5" : ""
						} ${className}`}
						style={style}
						aria-busy="true"
						role="status"
					>
						<span className="sr-only">読み込み中</span>
					</div>
				))}
			</div>
		);
	}

	return (
		<div
			className={`animate-pulse bg-gray-200 ${variantClass} ${className}`}
			style={style}
			aria-busy="true"
			role="status"
		>
			<span className="sr-only">読み込み中</span>
		</div>
	);
};
