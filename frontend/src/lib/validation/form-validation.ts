/**
 * フォームバリデーション共通ユーティリティ
 *
 * 各フォームコンポーネントで共通利用されるバリデーション関数
 *
 * 設計方針:
 * - 再利用可能な単一責任の関数
 * - 型安全なバリデーション
 * - 国際化対応を考慮したエラーメッセージ
 */

/**
 * 金額フィールドのバリデーション
 */
export function validateAmount(value: number): string | undefined {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "金額は必須です";
	}
	if (value <= 0) {
		return "金額は1円以上で入力してください";
	}
	if (value > 1000000) {
		return "金額は100万円以下で入力してください";
	}
	return undefined;
}

/**
 * 必須文字列フィールドのバリデーション
 */
export function validateRequiredString(
	value: string | null | undefined,
	fieldName: string,
): string | undefined {
	if (!value || value.trim().length === 0) {
		return `${fieldName}は必須です`;
	}
	return undefined;
}

/**
 * 日付フィールドのバリデーション
 */
export function validateDate(value: string): string | undefined {
	if (!value || value.trim().length === 0) {
		return "日付は必須です";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "有効な日付を入力してください";
	}

	return undefined;
}

/**
 * 文字列長制限のバリデーション
 */
export function validateStringLength(
	value: string | undefined,
	maxLength: number,
	fieldName: string,
): string | undefined {
	if (value && value.length > maxLength) {
		return `${fieldName}は${maxLength}文字以内で入力してください`;
	}
	return undefined;
}

/**
 * 文字列名制限のバリデーション（サービス名等）
 */
export function validateName(
	value: string | undefined,
	fieldName: string,
	maxLength = 100,
): string | undefined {
	const requiredError = validateRequiredString(value, fieldName);
	if (requiredError) {
		return requiredError;
	}

	return validateStringLength(value, maxLength, fieldName);
}

/**
 * 複数のバリデーション結果をまとめる
 */
export function combineValidationResults(
	...results: Array<string | undefined>
): string | undefined {
	return results.find((result) => result !== undefined);
}
