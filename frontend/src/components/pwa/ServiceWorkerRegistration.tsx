"use client";

import { useEffect, useState } from "react";

/**
 * サービスワーカー登録コンポーネント
 * PWA機能を有効化するためのクライアントサイドコンポーネント
 */

// サービスワーカーの状態を管理する型
type ServiceWorkerState = {
	isRegistered: boolean;
	isUpdateAvailable: boolean;
	isOffline: boolean;
	registration: ServiceWorkerRegistration | null;
	error: string | null;
};

// サービスワーカーの状態を管理するフック
export function useServiceWorker() {
	const [state, setState] = useState<ServiceWorkerState>({
		isRegistered: false,
		isUpdateAvailable: false,
		isOffline: !navigator.onLine,
		registration: null,
		error: null,
	});

	useEffect(() => {
		// サービスワーカーがサポートされていない場合
		if (!("serviceWorker" in navigator)) {
			setState((prev) => ({
				...prev,
				error: "このブラウザではサービスワーカーがサポートされていません。",
			}));
			return;
		}

		// オンライン/オフライン状態の監視
		const handleOnline = () =>
			setState((prev) => ({ ...prev, isOffline: false }));
		const handleOffline = () =>
			setState((prev) => ({ ...prev, isOffline: true }));

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// サービスワーカーの登録
		registerServiceWorker();

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/**
	 * サービスワーカーを登録
	 */
	const registerServiceWorker = async () => {
		try {
			console.log("[PWA] Registering service worker...");

			const registration = await navigator.serviceWorker.register("/sw.js", {
				scope: "/",
				// 開発環境では頻繁にアップデートチェックを行う
				updateViaCache:
					process.env.NODE_ENV === "development" ? "none" : "imports",
			});

			console.log(
				"[PWA] Service worker registered successfully:",
				registration,
			);

			setState((prev) => ({
				...prev,
				isRegistered: true,
				registration,
				error: null,
			}));

			// アップデートの監視
			registration.addEventListener("updatefound", () => {
				console.log("[PWA] Service worker update found");

				const newWorker = registration.installing;
				if (!newWorker) return;

				newWorker.addEventListener("statechange", () => {
					if (
						newWorker.state === "installed" &&
						navigator.serviceWorker.controller
					) {
						console.log("[PWA] Service worker update available");
						setState((prev) => ({
							...prev,
							isUpdateAvailable: true,
						}));
					}
				});
			});

			// メッセージの受信
			navigator.serviceWorker.addEventListener("message", (event) => {
				console.log("[PWA] Message from service worker:", event.data);
			});
		} catch (error) {
			console.error("[PWA] Service worker registration failed:", error);
			setState((prev) => ({
				...prev,
				error:
					error instanceof Error
						? error.message
						: "サービスワーカーの登録に失敗しました。",
			}));
		}
	};

	/**
	 * サービスワーカーのアップデートを適用
	 */
	const applyUpdate = async () => {
		if (!state.registration) return;

		try {
			console.log("[PWA] Applying service worker update...");

			// 新しいサービスワーカーに切り替え
			const waitingWorker = state.registration.waiting;
			if (waitingWorker) {
				waitingWorker.postMessage({ type: "SKIP_WAITING" });
			}

			// ページをリロード
			window.location.reload();
		} catch (error) {
			console.error("[PWA] Failed to apply update:", error);
		}
	};

	/**
	 * キャッシュをクリア
	 */
	const clearCache = async () => {
		if (!state.registration) return;

		try {
			console.log("[PWA] Clearing cache...");

			// サービスワーカーにキャッシュクリアを要求
			const messageChannel = new MessageChannel();
			if (state.registration.active) {
				state.registration.active.postMessage({ type: "CACHE_CLEAR" }, [
					messageChannel.port2,
				]);
			}

			// キャッシュクリア後にページをリロード
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} catch (error) {
			console.error("[PWA] Failed to clear cache:", error);
		}
	};

	/**
	 * キャッシュステータスを取得
	 */
	const getCacheStatus = async (): Promise<any> => {
		if (!state.registration) return null;

		try {
			const messageChannel = new MessageChannel();

			return new Promise((resolve) => {
				messageChannel.port1.onmessage = (event) => {
					resolve(event.data);
				};

				if (state.registration?.active) {
					state.registration.active.postMessage({ type: "CACHE_STATUS" }, [
						messageChannel.port2,
					]);
				} else {
					resolve(null);
				}
			});
		} catch (error) {
			console.error("[PWA] Failed to get cache status:", error);
			return null;
		}
	};

	return {
		...state,
		applyUpdate,
		clearCache,
		getCacheStatus,
	};
}

/**
 * サービスワーカー登録コンポーネント
 * アプリケーションに組み込んで使用
 */
export default function ServiceWorkerRegistration() {
	const { isRegistered, isUpdateAvailable, isOffline, error, applyUpdate } =
		useServiceWorker();

	// 開発環境では詳細なログを表示
	if (process.env.NODE_ENV === "development") {
		console.log("[PWA] Service Worker State:", {
			isRegistered,
			isUpdateAvailable,
			isOffline,
			error,
		});
	}

	return (
		<>
			{/* オフライン状態の表示 */}
			{isOffline && (
				<div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 text-sm z-50">
					<span>📱 オフライン状態です - 一部の機能が利用できません</span>
				</div>
			)}

			{/* アップデート通知 */}
			{isUpdateAvailable && (
				<div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">アップデート利用可能</p>
						<p className="text-sm opacity-90">
							新しいバージョンが利用可能です。
						</p>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={applyUpdate}
							className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
						>
							更新
						</button>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-800"
						>
							後で
						</button>
					</div>
				</div>
			)}

			{/* エラー表示（開発環境のみ） */}
			{error && process.env.NODE_ENV === "development" && (
				<div className="fixed bottom-4 left-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
					<div className="mb-2">
						<p className="font-medium">サービスワーカーエラー</p>
						<p className="text-sm opacity-90">{error}</p>
					</div>
				</div>
			)}
		</>
	);
}

/**
 * プッシュ通知の許可を要求する関数
 * 将来的な機能拡張のための基盤
 */
export async function requestNotificationPermission(): Promise<boolean> {
	if (!("Notification" in window)) {
		console.warn("[PWA] Notifications not supported");
		return false;
	}

	if (Notification.permission === "granted") {
		return true;
	}

	if (Notification.permission === "denied") {
		console.warn("[PWA] Notification permission denied");
		return false;
	}

	try {
		const permission = await Notification.requestPermission();
		return permission === "granted";
	} catch (error) {
		console.error("[PWA] Failed to request notification permission:", error);
		return false;
	}
}

/**
 * プッシュ通知の購読を設定
 * 将来的な機能拡張のための基盤
 */
export async function subscribeToPushNotifications(
	registration: ServiceWorkerRegistration,
	vapidKey: string,
): Promise<PushSubscription | null> {
	try {
		const permission = await requestNotificationPermission();
		if (!permission) {
			throw new Error("Notification permission not granted");
		}

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidKey),
		});

		console.log("[PWA] Push notification subscription created:", subscription);
		return subscription;
	} catch (error) {
		console.error("[PWA] Failed to subscribe to push notifications:", error);
		return null;
	}
}

/**
 * VAPID キーを Uint8Array に変換
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray;
}
