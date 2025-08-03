/**
 * パフォーマンス最適化用ユーティリティ関数
 *
 * debounceとthrottleの実装を提供し、頻繁な関数実行を制御する
 */

/**
 * debounce関数
 * 指定された遅延時間後に関数を実行する
 * 連続して呼び出された場合、最後の呼び出しのみが実行される
 *
 * @param fn 実行する関数
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた関数
 */
export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		// 既存のタイマーをクリア
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// 新しいタイマーを設定
		timeoutId = setTimeout(() => {
			fn(...args);
			timeoutId = null;
		}, delay);
	};
}

/**
 * throttle関数
 * 指定された間隔で関数の実行を制限する
 * 連続して呼び出されても、指定間隔内では一度しか実行されない
 *
 * @param fn 実行する関数
 * @param limit 実行間隔（ミリ秒）
 * @returns スロットルされた関数
 */
export function throttle<T extends (...args: any[]) => any>(
	fn: T,
	limit: number,
): (...args: Parameters<T>) => void {
	let inThrottle = false;
	let lastArgs: Parameters<T> | null = null;
	let lastThis: any = null;

	return function (this: any, ...args: Parameters<T>) {
		if (!inThrottle) {
			fn.apply(this, args);
			inThrottle = true;

			setTimeout(() => {
				inThrottle = false;
				// 待機中に呼び出しがあった場合、最後の呼び出しを実行
				if (lastArgs) {
					fn.apply(lastThis, lastArgs);
					lastArgs = null;
					lastThis = null;
				}
			}, limit);
		} else {
			// 待機中の場合、最後の引数を保存
			lastArgs = args;
			lastThis = this;
		}
	};
}
