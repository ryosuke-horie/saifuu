import type { FC } from "react";

export interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	color?: "primary" | "secondary";
	className?: string;
}

const sizeClasses = {
	sm: "h-4 w-4",
	md: "h-6 w-6",
	lg: "h-8 w-8",
} as const;

const colorClasses = {
	primary: "border-blue-600",
	secondary: "border-gray-600",
} as const;

export const Spinner: FC<SpinnerProps> = ({
	size = "sm",
	color = "primary",
	className = "",
}) => {
	const sizeClass = sizeClasses[size];
	const colorClass = colorClasses[color];

	return (
		<div
			role="status"
			aria-live="polite"
			aria-label="読み込み中"
			className={`animate-spin rounded-full border-b-2 ${sizeClass} ${colorClass} ${className}`}
		/>
	);
};
