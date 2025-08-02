/**
 * useMediaQuery カスタムフック
 * 
 * メディアクエリの状態を監視し、レスポンシブデザインを実現
 * ウィンドウサイズの変更に応じて動的に状態を更新
 */

import { useEffect, useState } from "react";

/**
 * useMediaQuery カスタムフック
 * 
 * @param query - メディアクエリ文字列（例: "(max-width: 768px)"）
 * @returns メディアクエリがマッチするかどうか
 */
export const useMediaQuery = (query: string): boolean => {
	const [matches, setMatches] = useState<boolean>(() => {
		// SSR対応: サーバーサイドではfalseを返す
		if (typeof window === "undefined") {
			return false;
		}
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		// クライアントサイドでのみ実行
		if (typeof window === "undefined") {
			return;
		}

		const mediaQuery = window.matchMedia(query);
		
		// 初期値を設定
		setMatches(mediaQuery.matches);

		// イベントハンドラー
		const handleChange = (e: MediaQueryListEvent) => {
			setMatches(e.matches);
		};

		// イベントリスナーを追加
		// 新しいAPIと古いAPIの両方に対応
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener("change", handleChange);
		} else {
			// 古いブラウザ向けのフォールバック
			mediaQuery.addListener(handleChange);
		}

		// クリーンアップ
		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener("change", handleChange);
			} else {
				// 古いブラウザ向けのフォールバック
				mediaQuery.removeListener(handleChange);
			}
		};
	}, [query]);

	return matches;
};

/**
 * よく使用するブレークポイント
 */
export const BREAKPOINTS = {
	mobile: "(max-width: 768px)",
	tablet: "(min-width: 769px) and (max-width: 1024px)",
	desktop: "(min-width: 1025px)",
} as const;

/**
 * モバイルデバイスかどうかを判定
 */
export const useIsMobile = (): boolean => {
	return useMediaQuery(BREAKPOINTS.mobile);
};

/**
 * タブレットデバイスかどうかを判定
 */
export const useIsTablet = (): boolean => {
	return useMediaQuery(BREAKPOINTS.tablet);
};

/**
 * デスクトップデバイスかどうかを判定
 */
export const useIsDesktop = (): boolean => {
	return useMediaQuery(BREAKPOINTS.desktop);
};