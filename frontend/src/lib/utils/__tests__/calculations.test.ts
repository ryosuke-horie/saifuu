/**
 * 計算ユーティリティ関数のテスト
 *
 * ゼロ除算やエッジケースを含む包括的なテスト
 */

import { describe, expect, it } from "vitest";
import {
	calculateMonthOverMonth,
	calculatePercentage,
	safeSum,
} from "../calculations";

describe("calculatePercentage", () => {
	it("正常なケース：通常のパーセンテージ計算", () => {
		expect(calculatePercentage(25, 100)).toBe(25);
		expect(calculatePercentage(1, 3)).toBe(33); // 33.33... → 33
		expect(calculatePercentage(2, 3)).toBe(67); // 66.66... → 67
	});

	it("ゼロ除算ケース：分母が0の場合は0を返す", () => {
		expect(calculatePercentage(100, 0)).toBe(0);
		expect(calculatePercentage(1, 0)).toBe(0);
	});

	it("エッジケース：分母が負の値の場合は0を返す", () => {
		expect(calculatePercentage(50, -100)).toBe(0);
	});

	it("エッジケース：分子が負の値の場合は0を返す", () => {
		expect(calculatePercentage(-50, 100)).toBe(0);
	});

	it("エッジケース：両方が0の場合は0を返す", () => {
		expect(calculatePercentage(0, 0)).toBe(0);
	});

	it("エッジケース：分子が0で分母が正の値の場合は0を返す", () => {
		expect(calculatePercentage(0, 100)).toBe(0);
	});

	it("NaN/Infinityケース：無効な値の場合は0を返す", () => {
		expect(calculatePercentage(Number.NaN, 100)).toBe(0);
		expect(calculatePercentage(100, Number.NaN)).toBe(0);
		expect(calculatePercentage(Number.POSITIVE_INFINITY, 100)).toBe(0);
		expect(calculatePercentage(100, Number.POSITIVE_INFINITY)).toBe(0);
		expect(calculatePercentage(Number.NEGATIVE_INFINITY, 100)).toBe(0);
	});

	it("小数点の四捨五入", () => {
		expect(calculatePercentage(1, 6)).toBe(17); // 16.66... → 17
		expect(calculatePercentage(1, 7)).toBe(14); // 14.28... → 14
	});
});

describe("calculateMonthOverMonth", () => {
	it("通常のケース：正の変化率", () => {
		expect(calculateMonthOverMonth(120, 100)).toBe(20); // +20%
		expect(calculateMonthOverMonth(200, 100)).toBe(100); // +100%
	});

	it("通常のケース：負の変化率", () => {
		expect(calculateMonthOverMonth(80, 100)).toBe(-20); // -20%
		expect(calculateMonthOverMonth(50, 100)).toBe(-50); // -50%
	});

	it("変化なしのケース", () => {
		expect(calculateMonthOverMonth(100, 100)).toBe(0); // 0%
	});

	it("前月が0のケース：今月が正の値", () => {
		expect(calculateMonthOverMonth(100, 0)).toBe(100);
		expect(calculateMonthOverMonth(1, 0)).toBe(100);
	});

	it("前月が0のケース：今月も0", () => {
		expect(calculateMonthOverMonth(0, 0)).toBe(0);
	});

	it("前月が0のケース：今月が負の値", () => {
		expect(calculateMonthOverMonth(-100, 0)).toBe(-100);
	});

	it("NaN/Infinityケース：無効な値の場合は0を返す", () => {
		expect(calculateMonthOverMonth(Number.NaN, 100)).toBe(0);
		expect(calculateMonthOverMonth(100, Number.NaN)).toBe(0);
		expect(calculateMonthOverMonth(Number.POSITIVE_INFINITY, 100)).toBe(0);
		expect(calculateMonthOverMonth(100, Number.POSITIVE_INFINITY)).toBe(0);
	});

	it("小数点の四捨五入", () => {
		expect(calculateMonthOverMonth(103, 100)).toBe(3); // 3%
		expect(calculateMonthOverMonth(106.7, 100)).toBe(7); // 6.7% → 7%
	});
});

describe("safeSum", () => {
	it("通常のケース：正の値の配列", () => {
		expect(safeSum([1, 2, 3, 4, 5])).toBe(15);
		expect(safeSum([10.5, 20.25, 30.75])).toBe(61.5);
	});

	it("空配列のケース", () => {
		expect(safeSum([])).toBe(0);
	});

	it("0を含む配列", () => {
		expect(safeSum([0, 1, 2])).toBe(3);
		expect(safeSum([0, 0, 0])).toBe(0);
	});

	it("負の値を含む配列：負の値は0として扱う", () => {
		expect(safeSum([1, -2, 3])).toBe(4); // -2は0として扱われる
		expect(safeSum([-1, -2, -3])).toBe(0);
	});

	it("NaN/Infinityを含む配列：無効な値は0として扱う", () => {
		expect(safeSum([1, Number.NaN, 3])).toBe(4);
		expect(safeSum([1, Number.POSITIVE_INFINITY, 3])).toBe(4);
		expect(safeSum([1, Number.NEGATIVE_INFINITY, 3])).toBe(4);
	});

	it("混合ケース：有効・無効・負の値が混在", () => {
		expect(
			safeSum([1, -2, Number.NaN, 4, Number.POSITIVE_INFINITY, 0, 5]),
		).toBe(10); // 1 + 0 + 0 + 4 + 0 + 0 + 5
	});
});
