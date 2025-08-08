/**
 * 数値計算関連のユーティリティ関数
 *
 * ゼロ除算やNaN/Infinityの対策を含む安全な計算を提供
 */

/**
 * 安全にパーセンテージを計算する関数
 *
 * @param value - 分子となる値
 * @param total - 分母となる値（合計値）
 * @returns パーセンテージ（0-100の整数）
 *
 * 以下の場合は0を返す：
 * - totalが0以下
 * - valueまたはtotalがNaNまたはInfinity
 * - valueが負の値（負のパーセンテージを避けるため）
 */
export function calculatePercentage(value: number, total: number): number {
	// 入力値の検証
	if (
		total <= 0 ||
		value < 0 ||
		!Number.isFinite(value) ||
		!Number.isFinite(total)
	) {
		return 0;
	}

	// パーセンテージを計算し、整数に四捨五入
	return Math.round((value / total) * 100);
}

/**
 * 前月比の変化率を計算する関数
 *
 * @param currentValue - 今月の値
 * @param previousValue - 前月の値
 * @returns 変化率のパーセンテージ（正の値は増加、負の値は減少を示す）
 *
 * 特殊ケース：
 * - 前月が0で今月が正の値の場合：100%を返す
 * - 前月が0で今月も0の場合：0%を返す
 * - 前月が0で今月が負の値の場合：-100%を返す
 */
export function calculateMonthOverMonth(
	currentValue: number,
	previousValue: number,
): number {
	// 入力値の検証
	if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue)) {
		return 0;
	}

	// 前月が0の場合の特殊処理
	if (previousValue === 0) {
		if (currentValue > 0) return 100;
		if (currentValue < 0) return -100;
		return 0;
	}

	// 通常の変化率計算
	return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

/**
 * 複数の値の合計を安全に計算する関数
 *
 * @param values - 合計する値の配列
 * @returns 合計値（無効な値は0として扱う）
 */
export function safeSum(values: number[]): number {
	return values.reduce((sum, value) => {
		return sum + (Number.isFinite(value) && value >= 0 ? value : 0);
	}, 0);
}
