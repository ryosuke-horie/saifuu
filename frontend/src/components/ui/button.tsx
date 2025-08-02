import { forwardRef } from "react";

// ボタンのバリアント定義
const buttonVariants = {
	default: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
	outline:
		"border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-green-500",
	destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
	ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
} as const;

// ボタンのサイズ定義
const buttonSizes = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-sm",
	lg: "px-6 py-3 text-base",
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
};

// Buttonコンポーネント
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className = "", variant = "default", size = "md", ...props }, ref) => {
		const baseStyles =
			"inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
		const variantStyles = buttonVariants[variant];
		const sizeStyles = buttonSizes[size];

		return (
			<button
				ref={ref}
				className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";
