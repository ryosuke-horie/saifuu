/**
 * 汎用的な計算関数を提供するユーティリティモジュール
 */

/**
 * パーセンテージを安全に計算する
 * ゼロ除算や不正な値に対するガードを含む
 *
 * @param value - 分子となる値
 * @param total - 分母となる値（合計値）
 * @returns 計算されたパーセンテージ（0-100の整数）、エラー時は0
 *
 * @example
 * calculatePercentage(50, 100) // 50
 * calculatePercentage(25, 0) // 0（ゼロ除算回避）
 * calculatePercentage(NaN, 100) // 0（不正な値）
 */
export function calculatePercentage(value: number, total: number): number {
	// ゼロ除算、負の合計値、不正な数値のチェック
	if (total <= 0 || !Number.isFinite(value) || !Number.isFinite(total)) {
		return 0;
	}

	// パーセンテージを計算して四捨五入
	return Math.round((value / total) * 100);
}
