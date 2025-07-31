// トースト通知のコンテキストプロバイダー
// アプリケーション全体でトースト通知を管理

"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { ToastContainer } from "@/components/ui/ToastContainer";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextValue {
	showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// トースト通知のデフォルト表示時間（ミリ秒）
const TOAST_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = "success") => {
			const id = `${Date.now()}-${Math.random()}`;
			const newToast: Toast = { id, message, type };

			setToasts((prev) => [...prev, newToast]);

			// 指定時間後に自動的に削除
			setTimeout(() => {
				removeToast(id);
			}, TOAST_DURATION);
		},
		[removeToast],
	);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<ToastContainer toasts={toasts} onClose={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
