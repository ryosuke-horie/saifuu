import { describe, expect, it } from "vitest";
import { calculatePercentage } from "./calculations";

describe("calculatePercentage", () => {
	describe("正常系", () => {
		it("通常のパーセンテージ計算が正しく行われる", () => {
			expect(calculatePercentage(50, 100)).toBe(50);
			expect(calculatePercentage(25, 100)).toBe(25);
			expect(calculatePercentage(75, 100)).toBe(75);
			expect(calculatePercentage(100, 100)).toBe(100);
		});

		it("小数の結果を四捨五入する", () => {
			expect(calculatePercentage(33, 100)).toBe(33);
			expect(calculatePercentage(66.6, 100)).toBe(67);
			expect(calculatePercentage(1, 3)).toBe(33);
			expect(calculatePercentage(2, 3)).toBe(67);
		});

		it("100%を超える値も正しく計算する", () => {
			expect(calculatePercentage(150, 100)).toBe(150);
			expect(calculatePercentage(200, 100)).toBe(200);
		});

		it("0の値に対して0を返す", () => {
			expect(calculatePercentage(0, 100)).toBe(0);
		});
	});

	describe("エッジケース", () => {
		it("ゼロ除算の場合は0を返す", () => {
			expect(calculatePercentage(50, 0)).toBe(0);
			expect(calculatePercentage(100, 0)).toBe(0);
			expect(calculatePercentage(0, 0)).toBe(0);
		});

		it("負の合計値の場合は0を返す", () => {
			expect(calculatePercentage(50, -100)).toBe(0);
			expect(calculatePercentage(-50, -100)).toBe(0);
		});

		it("NaNの入力に対して0を返す", () => {
			expect(calculatePercentage(Number.NaN, 100)).toBe(0);
			expect(calculatePercentage(50, Number.NaN)).toBe(0);
			expect(calculatePercentage(Number.NaN, Number.NaN)).toBe(0);
		});

		it("Infinityの入力に対して0を返す", () => {
			expect(calculatePercentage(Number.POSITIVE_INFINITY, 100)).toBe(0);
			expect(calculatePercentage(50, Number.POSITIVE_INFINITY)).toBe(0);
			expect(calculatePercentage(Number.NEGATIVE_INFINITY, 100)).toBe(0);
			expect(calculatePercentage(50, Number.NEGATIVE_INFINITY)).toBe(0);
		});

		it("非常に小さい値でも正しく計算する", () => {
			expect(calculatePercentage(0.01, 100)).toBe(0);
			expect(calculatePercentage(0.5, 100)).toBe(1);
			expect(calculatePercentage(0.4, 100)).toBe(0);
		});
	});

	describe("実用的なケース", () => {
		it("月次収入の内訳計算", () => {
			const totalIncome = 500000;
			const salaryIncome = 400000;
			const sideIncome = 100000;

			expect(calculatePercentage(salaryIncome, totalIncome)).toBe(80);
			expect(calculatePercentage(sideIncome, totalIncome)).toBe(20);
		});

		it("収入がない月の計算", () => {
			const totalIncome = 0;
			const categoryIncome = 0;

			expect(calculatePercentage(categoryIncome, totalIncome)).toBe(0);
		});

		it("前月比の増減率計算", () => {
			const lastMonth = 100000;
			const increase = 20000;

			expect(calculatePercentage(increase, lastMonth)).toBe(20);
		});
	});
});
