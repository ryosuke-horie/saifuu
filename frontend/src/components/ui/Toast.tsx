// トースト通知コンポーネント
// 成功、エラー、情報、警告の各種通知を画面上部に表示

"use client";

import type { Toast as ToastType } from "@/contexts/ToastContext";

interface ToastProps {
	toast: ToastType;
	onClose: (id: string) => void;
}

// トーストタイプごとのスタイル設定
const toastStyles = {
	success: {
		bg: "bg-green-50",
		border: "border-green-200",
		text: "text-green-800",
		icon: "✓",
		iconBg: "bg-green-100 text-green-600",
	},
	error: {
		bg: "bg-red-50",
		border: "border-red-200",
		text: "text-red-800",
		icon: "✕",
		iconBg: "bg-red-100 text-red-600",
	},
	info: {
		bg: "bg-blue-50",
		border: "border-blue-200",
		text: "text-blue-800",
		icon: "ℹ",
		iconBg: "bg-blue-100 text-blue-600",
	},
	warning: {
		bg: "bg-yellow-50",
		border: "border-yellow-200",
		text: "text-yellow-800",
		icon: "!",
		iconBg: "bg-yellow-100 text-yellow-600",
	},
};

export function Toast({ toast, onClose }: ToastProps) {
	const style = toastStyles[toast.type];

	return (
		<div
			className={`${style.bg} ${style.border} ${style.text} border rounded-lg p-4 pr-12 shadow-lg animate-slide-in max-w-md`}
			role="alert"
		>
			<div className="flex items-start">
				<div
					className={`${style.iconBg} rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0`}
				>
					{style.icon}
				</div>
				<p className="text-sm leading-relaxed">{toast.message}</p>
			</div>
			<button
				type="button"
				onClick={() => onClose(toast.id)}
				className={`absolute top-4 right-4 ${style.text} hover:opacity-70 transition-opacity`}
				aria-label="閉じる"
			>
				<svg
					className="w-4 h-4"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
		</div>
	);
}
