"use client";

import { type FC, type ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Dialogコンポーネント
 *
 * モーダルダイアログを表示するコンポーネント
 * - React Portalを使用してコンポーネントツリー外にレンダリング
 * - フォーカス管理とキーボードナビゲーション対応
 * - アクセシビリティに配慮したARIA属性設定
 * - Tailwind CSSによるスムーズなアニメーション
 *
 * 設計方針:
 * - 再利用可能なUIコンポーネントとして設計
 * - アクセシビリティとユーザビリティを重視
 * - 設定可能なオプションによる柔軟性の提供
 * - パフォーマンスを考慮した実装
 *
 * 代替案として考慮した実装:
 * - CSS-in-JS: プロジェクトの統一性からTailwind CSSを採用
 * - 外部ライブラリ: 制御の柔軟性とバンドルサイズから自前実装を選択
 */

export interface DialogProps {
	/**
	 * ダイアログの表示状態
	 * trueの場合にダイアログが表示される
	 */
	isOpen: boolean;

	/**
	 * ダイアログを閉じる際のコールバック関数
	 * ESCキー押下やオーバーレイクリック時に呼び出される
	 */
	onClose: () => void;

	/**
	 * ダイアログのタイトル（オプション）
	 * 設定された場合、ダイアログ上部にタイトルが表示される
	 */
	title?: string;

	/**
	 * ダイアログの内容
	 * 任意のReactノードを指定可能
	 */
	children: ReactNode;

	/**
	 * オーバーレイクリックでダイアログを閉じるかどうか
	 * デフォルト: true
	 */
	closeOnOverlayClick?: boolean;

	/**
	 * ESCキー押下でダイアログを閉じるかどうか
	 * デフォルト: true
	 */
	closeOnEsc?: boolean;

	/**
	 * 追加のCSSクラス名
	 * ダイアログコンテナに適用される
	 */
	className?: string;
}

export const Dialog: FC<DialogProps> = ({
	isOpen,
	onClose,
	title,
	children,
	closeOnOverlayClick = true,
	closeOnEsc = true,
	className = "",
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const previousActiveElement = useRef<HTMLElement | null>(null);

	// オーバーレイクリックのハンドラー
	const handleOverlayClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			// ダイアログ内部のクリックは無視
			if (e.target === e.currentTarget && closeOnOverlayClick) {
				onClose();
			}
		},
		[closeOnOverlayClick, onClose],
	);

	// オーバーレイキーダウンのハンドラー
	const handleOverlayKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			// Enter または Space キーが押された場合にダイアログを閉じる
			if (
				(e.key === "Enter" || e.key === " ") &&
				e.target === e.currentTarget &&
				closeOnOverlayClick
			) {
				e.preventDefault();
				onClose();
			}
		},
		[closeOnOverlayClick, onClose],
	);

	// ESCキー押下のハンドラー
	useEffect(() => {
		const handleEscKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && closeOnEsc && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscKey);
		}

		return () => {
			document.removeEventListener("keydown", handleEscKey);
		};
	}, [closeOnEsc, isOpen, onClose]);

	// フォーカス管理
	useEffect(() => {
		if (isOpen) {
			// 現在のアクティブ要素を保存
			previousActiveElement.current = document.activeElement as HTMLElement;

			// ダイアログにフォーカスを移動
			// setTimeoutを使用してレンダリング後にフォーカスを設定
			setTimeout(() => {
				dialogRef.current?.focus();
			}, 0);

			// ボディのスクロールを無効化
			document.body.style.overflow = "hidden";
		} else {
			// ボディのスクロールを有効化
			document.body.style.overflow = "";

			// 元のアクティブ要素にフォーカスを戻す
			previousActiveElement.current?.focus();
		}

		// クリーンアップ
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// ダイアログが閉じている場合は何もレンダリングしない
	if (!isOpen) {
		return null;
	}

	// ポータルでレンダリングするコンテンツ
	const dialogContent = (
		<div
			className={[
				// オーバーレイ
				"fixed inset-0 z-50",
				"bg-black/50",
				"backdrop-blur-sm",

				// フレックスレイアウト（中央配置）
				"flex items-center justify-center",
				"p-4 sm:p-6 lg:p-8",

				// アニメーション
				"animate-in fade-in duration-200",
			].join(" ")}
			onClick={handleOverlayClick}
			onKeyDown={handleOverlayKeyDown}
			role="button"
			tabIndex={-1}
			aria-label="ダイアログを閉じる"
		>
			<div
				ref={dialogRef}
				className={[
					// 基本スタイル
					"relative",
					"w-full max-w-lg",
					"bg-white",
					"rounded-lg",
					"shadow-xl",

					// パディング
					"p-6",

					// アニメーション
					"animate-in zoom-in-95 duration-200",

					// 最大高さとスクロール
					"max-h-[90vh]",
					"overflow-y-auto",

					// カスタムクラス
					className,
				]
					.filter(Boolean)
					.join(" ")}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? "dialog-title" : undefined}
				tabIndex={-1}
			>
				{/* クローズボタン */}
				<button
					type="button"
					onClick={onClose}
					className={[
						// 位置
						"absolute top-4 right-4",

						// スタイル
						"inline-flex items-center justify-center",
						"w-8 h-8",
						"rounded-md",
						"text-gray-400",
						"hover:text-gray-500",
						"hover:bg-gray-100",
						"focus:outline-none",
						"focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",

						// トランジション
						"transition-colors duration-200",
					].join(" ")}
					aria-label="閉じる"
				>
					<svg
						className="w-5 h-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				{/* タイトル */}
				{title && (
					<h2
						id="dialog-title"
						className="text-lg font-semibold text-gray-900 mb-4 pr-8"
					>
						{title}
					</h2>
				)}

				{/* コンテンツ */}
				<div className="text-gray-600">{children}</div>
			</div>
		</div>
	);

	// React Portalを使用してbody直下にレンダリング
	return createPortal(dialogContent, document.body);
};
