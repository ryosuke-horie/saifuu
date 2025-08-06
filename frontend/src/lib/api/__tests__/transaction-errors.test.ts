/**
 * Transaction API エラーハンドリングのテスト
 *
 * TransactionApiErrorクラスとgetErrorMessage関数の振る舞いをテスト
 */

import { describe, expect, it } from "vitest";
import { ApiError } from "../errors";
import { getErrorMessage, TransactionApiError } from "../transaction-errors";

describe("TransactionApiError", () => {
	it("ApiErrorを継承している", () => {
		const error = new TransactionApiError(
			"create",
			"network",
			"エラーメッセージ",
		);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toBeInstanceOf(TransactionApiError);
	});

	it("操作タイプを保持する", () => {
		const error = new TransactionApiError(
			"create",
			"network",
			"エラーメッセージ",
		);
		expect(error.operation).toBe("create");
	});

	it("エラータイプとメッセージを正しく設定する", () => {
		const error = new TransactionApiError(
			"update",
			"validation",
			"バリデーションエラー",
			400,
		);
		expect(error.type).toBe("validation");
		expect(error.message).toBe("バリデーションエラー");
		expect(error.statusCode).toBe(400);
	});

	it("オプショナルなパラメータを処理する", () => {
		const response = { error: "Bad Request", details: "詳細" };
		const originalError = new Error("元のエラー");
		const error = new TransactionApiError(
			"delete",
			"server",
			"サーバーエラー",
			500,
			response,
			originalError,
		);

		expect(error.response).toEqual(response);
		expect(error.originalError).toBe(originalError);
	});
});

describe("getErrorMessage", () => {
	describe("取引作成時のエラー", () => {
		it("バリデーションエラーの場合、具体的なメッセージを返す", () => {
			const error = new TransactionApiError(
				"create",
				"validation",
				"入力エラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"入力内容に誤りがあります。金額や日付を確認してください。",
			);
		});

		it("ネットワークエラーの場合、接続エラーメッセージを返す", () => {
			const error = new TransactionApiError(
				"create",
				"network",
				"ネットワークエラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"サーバーに接続できません。ネットワーク接続を確認してください。",
			);
		});

		it("サーバーエラーの場合、一時的エラーメッセージを返す", () => {
			const error = new TransactionApiError(
				"create",
				"server",
				"サーバーエラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"取引の登録に失敗しました。しばらく待ってから再度お試しください。",
			);
		});
	});

	describe("取引更新時のエラー", () => {
		it("競合エラーの場合、更新競合メッセージを返す", () => {
			const error = new TransactionApiError("update", "conflict", "競合エラー");
			const message = getErrorMessage(error);
			expect(message).toBe(
				"他のユーザーによって更新されています。画面を更新してから再度お試しください。",
			);
		});

		it("見つからないエラーの場合、削除済みメッセージを返す", () => {
			const error = new TransactionApiError(
				"update",
				"notFound",
				"見つかりません",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"更新対象の取引が見つかりません。既に削除されている可能性があります。",
			);
		});
	});

	describe("取引削除時のエラー", () => {
		it("認可エラーの場合、権限不足メッセージを返す", () => {
			const error = new TransactionApiError(
				"delete",
				"forbidden",
				"権限がありません",
			);
			const message = getErrorMessage(error);
			expect(message).toBe("この取引を削除する権限がありません。");
		});

		it("見つからないエラーの場合、既に削除メッセージを返す", () => {
			const error = new TransactionApiError(
				"delete",
				"notFound",
				"見つかりません",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"削除対象の取引が見つかりません。既に削除されている可能性があります。",
			);
		});
	});

	describe("取引一覧取得時のエラー", () => {
		it("タイムアウトエラーの場合、読み込み時間超過メッセージを返す", () => {
			const error = new TransactionApiError("list", "timeout", "タイムアウト");
			const message = getErrorMessage(error);
			expect(message).toBe(
				"取引一覧の読み込みに時間がかかっています。しばらく待ってから再度お試しください。",
			);
		});

		it("認証エラーの場合、ログイン要求メッセージを返す", () => {
			const error = new TransactionApiError(
				"list",
				"unauthorized",
				"認証エラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe(
				"認証の有効期限が切れました。再度ログインしてください。",
			);
		});
	});

	describe("デフォルトメッセージ", () => {
		it("未定義の操作タイプの場合、デフォルトメッセージを返す", () => {
			const error = new TransactionApiError(
				"unknown" as any,
				"unknown",
				"不明なエラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe("取引の処理中にエラーが発生しました。");
		});

		it("未定義のエラータイプの場合、操作別のデフォルトメッセージを返す", () => {
			const error = new TransactionApiError(
				"create",
				"unknown",
				"不明なエラー",
			);
			const message = getErrorMessage(error);
			expect(message).toBe("取引の登録中に予期しないエラーが発生しました。");
		});
	});

	describe("通常のApiErrorの場合", () => {
		it("元のメッセージをそのまま返す", () => {
			const error = new ApiError("network", "カスタムエラーメッセージ");
			const message = getErrorMessage(error);
			expect(message).toBe("カスタムエラーメッセージ");
		});
	});

	describe("TransactionApiError以外のエラー", () => {
		it("Errorインスタンスの場合、メッセージを返す", () => {
			const error = new Error("通常のエラー");
			const message = getErrorMessage(error);
			expect(message).toBe("通常のエラー");
		});

		it("文字列エラーの場合、そのまま返す", () => {
			const error = "文字列エラー";
			const message = getErrorMessage(error);
			expect(message).toBe("文字列エラー");
		});

		it("その他の型の場合、デフォルトメッセージを返す", () => {
			const error = { some: "object" };
			const message = getErrorMessage(error);
			expect(message).toBe("予期しないエラーが発生しました。");
		});
	});
});
