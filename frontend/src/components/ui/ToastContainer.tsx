// トースト通知コンテナコンポーネント
// 複数のトースト通知を管理し、画面右上に表示

"use client";

import type { Toast as ToastType } from "@/contexts/ToastContext";
import { Toast } from "./Toast";

interface ToastContainerProps {
	toasts: ToastType[];
	onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
	return (
		<div className="fixed top-4 right-4 z-50 space-y-2">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onClose={onClose} />
			))}
		</div>
	);
}
