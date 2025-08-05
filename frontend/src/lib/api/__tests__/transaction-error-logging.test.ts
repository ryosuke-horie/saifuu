/**
 * Transaction エラーロギングのテスト
 *
 * 取引操作のエラーロギング改善をテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";
import {
	logTransactionError,
	TransactionApiError,
} from "../transaction-errors";

// console.errorのモック
const mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

describe("logTransactionError", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
		vi.unstubAllEnvs();
	});

	describe("開発環境", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
		});

		it("TransactionApiErrorの詳細情報をログ出力する", () => {
			const error = new TransactionApiError(
				"create",
				"validation",
				"バリデーションエラー",
				400,
				{ error: "Invalid data", fields: { amount: ["必須"] } },
			);

			logTransactionError(error, "test-context");

			expect(mockConsoleError).toHaveBeenCalledTimes(1);
			const logArgs = mockConsoleError.mock.calls[0];

			expect(logArgs[0]).toBe("[Transaction Error] [test-context]");
			expect(logArgs[1]).toMatchObject({
				operation: "create",
				type: "validation",
				statusCode: 400,
				message: "バリデーションエラー",
				response: { error: "Invalid data", fields: { amount: ["必須"] } },
			});
		});

		it("取引操作の種類を含めてログ出力する", () => {
			const errors = [
				new TransactionApiError("create", "network", "作成エラー"),
				new TransactionApiError("update", "conflict", "更新エラー"),
				new TransactionApiError("delete", "forbidden", "削除エラー"),
				new TransactionApiError("list", "timeout", "一覧取得エラー"),
			];

			errors.forEach((error, index) => {
				logTransactionError(error);
				const logArgs = mockConsoleError.mock.calls[index];
				expect(logArgs[1].operation).toBe(error.operation);
			});
		});

		it("スタックトレースを含めてログ出力する", () => {
			const error = new TransactionApiError(
				"create",
				"server",
				"サーバーエラー",
				500,
			);

			logTransactionError(error);

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[1]).toHaveProperty("stack");
			expect(logArgs[1].stack).toContain("TransactionApiError");
		});
	});

	describe("本番環境", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "production");
		});

		it("最小限の情報のみログ出力する", () => {
			const error = new TransactionApiError(
				"create",
				"validation",
				"バリデーションエラー",
				400,
				{ error: "Invalid data", details: "機密情報" },
			);

			logTransactionError(error, "prod-context");

			expect(mockConsoleError).toHaveBeenCalledTimes(1);
			const logArgs = mockConsoleError.mock.calls[0];

			expect(logArgs[0]).toBe("[Transaction Error] [prod-context]");
			expect(logArgs[1]).toEqual({
				operation: "create",
				type: "validation",
				statusCode: 400,
				message: "バリデーションエラー",
			});

			// 詳細情報が含まれていないことを確認
			expect(logArgs[1]).not.toHaveProperty("response");
			expect(logArgs[1]).not.toHaveProperty("stack");
		});
	});

	describe("エラータイプの処理", () => {
		it("通常のApiErrorをログ出力する", () => {
			const error = new ApiError("network", "ネットワークエラー");

			logTransactionError(error);

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [API Error]");
			expect(logArgs[1]).toMatchObject({
				type: "network",
				message: "ネットワークエラー",
			});
		});

		it("通常のErrorをログ出力する", () => {
			const error = new Error("通常のエラー");

			logTransactionError(error);

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [Unknown Error]");
			expect(logArgs[1]).toMatchObject({
				message: "通常のエラー",
			});
		});

		it("文字列エラーをログ出力する", () => {
			const error = "文字列エラー";

			logTransactionError(error);

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [Unknown Error]");
			expect(logArgs[1]).toEqual({
				error: "文字列エラー",
			});
		});
	});

	describe("コンテキスト情報", () => {
		it("コンテキストが指定されない場合のデフォルト値", () => {
			const error = new TransactionApiError("create", "network", "エラー");

			logTransactionError(error);

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [API Error]");
		});

		it("カスタムコンテキストを使用する", () => {
			const error = new TransactionApiError("update", "conflict", "エラー");

			logTransactionError(error, "UpdateTransaction");

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [UpdateTransaction]");
		});
	});

	describe("追加情報の記録", () => {
		it("取引IDを含むコンテキスト情報を記録する", () => {
			const error = new TransactionApiError(
				"update",
				"notFound",
				"取引が見つかりません",
				404,
			);

			logTransactionError(error, "UpdateTransaction:txn_123");

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe(
				"[Transaction Error] [UpdateTransaction:txn_123]",
			);
		});

		it("ユーザー操作のコンテキストを記録する", () => {
			const error = new TransactionApiError(
				"create",
				"validation",
				"入力エラー",
				400,
			);

			logTransactionError(error, "UserAction:ExpenseForm");

			const logArgs = mockConsoleError.mock.calls[0];
			expect(logArgs[0]).toBe("[Transaction Error] [UserAction:ExpenseForm]");
		});
	});
});
