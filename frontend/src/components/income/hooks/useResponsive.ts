/**
 * レスポンシブ対応のカスタムフック
 * ビューポートサイズに応じたUI調整を行う
 */

import { useEffect, useState } from "react";
import { BREAKPOINTS } from "../constants";

/**
 * モバイル表示かどうかを判定するカスタムフック
 * サーバーサイドレンダリング時は安全なデフォルト値を返す
 */
export function useIsMobile(): boolean {
	// SSR時のハイドレーションエラーを防ぐため、初期値はfalse
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// クライアントサイドでのみ実行
		const checkMobile = () => {
			setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE);
		};

		// 初回チェック
		checkMobile();

		// リサイズイベントのハンドラー（デバウンス付き）
		let timeoutId: NodeJS.Timeout;
		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(checkMobile, 150);
		};

		// イベントリスナーの登録
		window.addEventListener("resize", handleResize);

		// クリーンアップ
		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return isMobile;
}

/**
 * ビューポートサイズを取得するカスタムフック
 * より詳細なレスポンシブ制御が必要な場合に使用
 */
export function useViewportSize() {
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateSize = () => {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		// 初回実行
		updateSize();

		// リサイズイベント（デバウンス付き）
		let timeoutId: NodeJS.Timeout;
		const handleResize = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(updateSize, 150);
		};

		window.addEventListener("resize", handleResize);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return size;
}
