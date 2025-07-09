/**
 * Request ID 生成ユーティリティ
 *
 * middleware.ts と api-integration.ts の重複実装を統一
 *
 * 機能:
 * - UUID v4 形式のリクエストIDを生成
 * - crypto.randomUUID が利用可能な場合は使用
 * - フォールバック実装でブラウザ互換性を確保
 *
 * 使用例:
 * ```typescript
 * import { generateRequestId } from "./request-id";
 *
 * const requestId = generateRequestId();
 * console.log(requestId); // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 * ```
 */

/**
 * UUID v4 形式のリクエストIDを生成
 *
 * crypto.randomUUID が利用可能な場合は標準実装を使用し、
 * 利用できない場合はフォールバック実装を使用します。
 *
 * @returns UUID v4 形式の文字列
 */
export function generateRequestId(): string {
	// crypto.randomUUID が利用可能な場合（モダンブラウザ、Node.js 15.6.0+）
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// フォールバック: 簡易UUID v4生成
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
