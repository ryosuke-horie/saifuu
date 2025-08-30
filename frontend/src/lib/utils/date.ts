/**
 * 日付関連のユーティリティ関数
 * テストと実装で共通のロジックを使用することで整合性を保証
 */

/**
 * 今日の日付をYYYY-MM-DD形式の文字列で取得
 * @returns 今日の日付（YYYY-MM-DD形式）
 */
export const getToday = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};
