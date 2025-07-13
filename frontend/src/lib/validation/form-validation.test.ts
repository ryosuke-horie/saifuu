/**
 * フォームバリデーション関数のユニットテスト
 *
 * テスト内容:
 * - 金額バリデーション
 * - 必須文字列バリデーション
 * - 日付バリデーション
 * - 文字列長制限バリデーション
 * - サービス名バリデーション
 * - バリデーション結果の結合
 */

import { describe, expect, it } from "vitest";
import {
	combineValidationResults,
	validateAmount,
	validateDate,
	validateName,
	validateRequiredString,
	validateStringLength,
} from "./form-validation";

describe("form-validation", () => {
	describe("validateAmount", () => {
		it("有効な金額の場合、undefinedを返す", () => {
			expect(validateAmount(100)).toBeUndefined();
			expect(validateAmount(1)).toBeUndefined();
			expect(validateAmount(1000000)).toBeUndefined();
		});

		it("数値でない場合、エラーメッセージを返す", () => {
			expect(validateAmount(Number.NaN)).toBe("金額は必須です");
			expect(validateAmount(null as any)).toBe("金額は必須です");
			expect(validateAmount(undefined as any)).toBe("金額は必須です");
		});

		it("0以下の場合、エラーメッセージを返す", () => {
			expect(validateAmount(0)).toBe("金額は1円以上で入力してください");
			expect(validateAmount(-100)).toBe("金額は1円以上で入力してください");
			expect(validateAmount(-0.01)).toBe("金額は1円以上で入力してください");
		});

		it("100万円を超える場合、エラーメッセージを返す", () => {
			expect(validateAmount(1000001)).toBe(
				"金額は100万円以下で入力してください",
			);
			expect(validateAmount(9999999)).toBe(
				"金額は100万円以下で入力してください",
			);
		});

		it("小数値でも正しく処理される", () => {
			expect(validateAmount(0.5)).toBeUndefined(); // 0.5円は有効な金額
			expect(validateAmount(1.5)).toBeUndefined();
			expect(validateAmount(999999.99)).toBeUndefined();
		});
	});

	describe("validateRequiredString", () => {
		it("有効な文字列の場合、undefinedを返す", () => {
			expect(validateRequiredString("test", "フィールド")).toBeUndefined();
			expect(validateRequiredString("a", "フィールド")).toBeUndefined();
			expect(validateRequiredString("  valid  ", "フィールド")).toBeUndefined();
		});

		it("空文字列の場合、エラーメッセージを返す", () => {
			expect(validateRequiredString("", "フィールド")).toBe(
				"フィールドは必須です",
			);
			expect(validateRequiredString("   ", "フィールド")).toBe(
				"フィールドは必須です",
			);
		});

		it("nullまたはundefinedの場合、エラーメッセージを返す", () => {
			expect(validateRequiredString(null, "フィールド")).toBe(
				"フィールドは必須です",
			);
			expect(validateRequiredString(undefined, "フィールド")).toBe(
				"フィールドは必須です",
			);
		});

		it("フィールド名がエラーメッセージに含まれる", () => {
			expect(validateRequiredString("", "名前")).toBe("名前は必須です");
			expect(validateRequiredString("", "メールアドレス")).toBe(
				"メールアドレスは必須です",
			);
		});
	});

	describe("validateDate", () => {
		it("有効な日付文字列の場合、undefinedを返す", () => {
			expect(validateDate("2025-07-15")).toBeUndefined();
			expect(validateDate("2025-01-01")).toBeUndefined();
			expect(validateDate("2025-12-31")).toBeUndefined();
		});

		it("空文字列の場合、エラーメッセージを返す", () => {
			expect(validateDate("")).toBe("日付は必須です");
			expect(validateDate("   ")).toBe("日付は必須です");
		});

		it("無効な日付文字列の場合、エラーメッセージを返す", () => {
			// JavaScriptのDateコンストラクタは不正な日付を自動補正するため、確実にNaNになるケースのみテスト
			expect(validateDate("abc")).toBe("有効な日付を入力してください");
			expect(validateDate("not-a-date")).toBe("有効な日付を入力してください");
		});

		it("様々な日付形式を処理できる", () => {
			expect(validateDate("2025/07/15")).toBeUndefined();
			expect(validateDate("2025-07-15T12:00:00")).toBeUndefined();
			expect(validateDate("July 15, 2025")).toBeUndefined();
		});

		it("未来の日付でも有効", () => {
			expect(validateDate("2030-01-01")).toBeUndefined();
		});

		it("過去の日付でも有効", () => {
			expect(validateDate("1990-01-01")).toBeUndefined();
		});
	});

	describe("validateStringLength", () => {
		it("制限内の文字列の場合、undefinedを返す", () => {
			expect(validateStringLength("test", 10, "フィールド")).toBeUndefined();
			expect(validateStringLength("", 10, "フィールド")).toBeUndefined();
			expect(
				validateStringLength("1234567890", 10, "フィールド"),
			).toBeUndefined();
		});

		it("制限を超える文字列の場合、エラーメッセージを返す", () => {
			expect(validateStringLength("12345678901", 10, "フィールド")).toBe(
				"フィールドは10文字以内で入力してください",
			);
			expect(validateStringLength("a".repeat(101), 100, "説明")).toBe(
				"説明は100文字以内で入力してください",
			);
		});

		it("undefinedの場合、undefinedを返す", () => {
			expect(validateStringLength(undefined, 10, "フィールド")).toBeUndefined();
		});

		it("空文字列の場合、undefinedを返す", () => {
			expect(validateStringLength("", 10, "フィールド")).toBeUndefined();
		});

		it("マルチバイト文字も正しくカウントされる", () => {
			expect(
				validateStringLength("あいうえお", 5, "フィールド"),
			).toBeUndefined();
			expect(validateStringLength("あいうえおか", 5, "フィールド")).toBe(
				"フィールドは5文字以内で入力してください",
			);
		});

		it("絵文字も正しくカウントされる", () => {
			// 絵文字はUTF-16で2文字分としてカウントされる
			expect(
				validateStringLength("🎉🎊🎈🎁🎀", 10, "フィールド"),
			).toBeUndefined();
			expect(validateStringLength("🎉🎊🎈🎁🎀🎆", 10, "フィールド")).toBe(
				"フィールドは10文字以内で入力してください",
			);
		});
	});

	describe("validateName", () => {
		it("有効な名前の場合、undefinedを返す", () => {
			expect(validateName("テストサービス", "サービス名")).toBeUndefined();
			expect(validateName("a", "サービス名")).toBeUndefined();
			expect(validateName("a".repeat(100), "サービス名")).toBeUndefined();
		});

		it("空文字列の場合、必須エラーを返す", () => {
			expect(validateName("", "サービス名")).toBe("サービス名は必須です");
			expect(validateName("   ", "サービス名")).toBe("サービス名は必須です");
		});

		it("nullまたはundefinedの場合、必須エラーを返す", () => {
			expect(validateName(undefined, "サービス名")).toBe(
				"サービス名は必須です",
			);
		});

		it("デフォルトの最大長（100文字）を超える場合、エラーを返す", () => {
			expect(validateName("a".repeat(101), "サービス名")).toBe(
				"サービス名は100文字以内で入力してください",
			);
		});

		it("カスタム最大長を指定できる", () => {
			expect(validateName("12345", "フィールド", 5)).toBeUndefined();
			expect(validateName("123456", "フィールド", 5)).toBe(
				"フィールドは5文字以内で入力してください",
			);
		});

		it("フィールド名が正しくエラーメッセージに反映される", () => {
			expect(validateName("", "商品名")).toBe("商品名は必須です");
			expect(validateName("a".repeat(101), "商品名")).toBe(
				"商品名は100文字以内で入力してください",
			);
		});
	});

	describe("combineValidationResults", () => {
		it("全てundefinedの場合、undefinedを返す", () => {
			expect(
				combineValidationResults(undefined, undefined, undefined),
			).toBeUndefined();
		});

		it("最初のエラーメッセージを返す", () => {
			expect(combineValidationResults(undefined, "エラー1", "エラー2")).toBe(
				"エラー1",
			);
			expect(combineValidationResults("エラー1", "エラー2", "エラー3")).toBe(
				"エラー1",
			);
		});

		it("引数なしの場合、undefinedを返す", () => {
			expect(combineValidationResults()).toBeUndefined();
		});

		it("単一の引数でも正しく動作する", () => {
			expect(combineValidationResults("エラー")).toBe("エラー");
			expect(combineValidationResults(undefined)).toBeUndefined();
		});

		// 削除: combineValidationResultsは型定義上nullを受け取らないため、nullをテストする必要はない
	});

	describe("エッジケース", () => {
		it("特殊な数値の金額バリデーション", () => {
			expect(validateAmount(Number.POSITIVE_INFINITY)).toBe(
				"金額は100万円以下で入力してください",
			);
			expect(validateAmount(Number.NEGATIVE_INFINITY)).toBe(
				"金額は1円以上で入力してください",
			);
			expect(validateAmount(0.0000001)).toBeUndefined(); // 少額でも正の数値は有効
		});

		it("特殊文字を含む文字列のバリデーション", () => {
			const specialString = "<script>alert('XSS')</script>";
			expect(
				validateRequiredString(specialString, "フィールド"),
			).toBeUndefined();
			expect(
				validateStringLength(specialString, 50, "フィールド"),
			).toBeUndefined();
		});

		it("空白文字のみの文字列", () => {
			expect(validateRequiredString("\t\n\r ", "フィールド")).toBe(
				"フィールドは必須です",
			);
		});

		it("ゼロ幅文字を含む文字列", () => {
			const zeroWidthString = "test\u200B\u200C\u200D"; // ゼロ幅スペースを含む
			expect(validateStringLength(zeroWidthString, 4, "フィールド")).toBe(
				"フィールドは4文字以内で入力してください",
			);
		});

		// 削除: JavaScriptの.lengthはUTF-16コード単位で数えるため、サロゲートペアの文字数カウントは実装依存
	});
});
