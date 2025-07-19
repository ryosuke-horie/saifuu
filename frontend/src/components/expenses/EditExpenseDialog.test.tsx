/**
 * EditExpenseDialog コンポーネントのテスト
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Category, Transaction } from "../../lib/api/types";
import { EditExpenseDialog } from "./EditExpenseDialog";

// モックカテゴリデータ
const mockCategories: Category[] = [
	{
		id: "1",
		name: "食費",
		type: "expense",
		color: "#FF0000",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "交通費",
		type: "expense",
		color: "#00FF00",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// モック取引データ
const mockTransaction: Transaction = {
	id: "tx-1",
	amount: 1000,
	type: "expense",
	description: "昼食代",
	date: "2024-01-15",
	category: mockCategories[0],
	createdAt: "2024-01-15T12:00:00Z",
	updatedAt: "2024-01-15T12:00:00Z",
};

describe("EditExpenseDialog", () => {
	const defaultProps = {
		isOpen: true,
		onClose: vi.fn(),
		onSubmit: vi.fn(),
		transaction: mockTransaction,
		categories: mockCategories,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("ダイアログが表示される", () => {
		render(<EditExpenseDialog {...defaultProps} />);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("取引編集")).toBeInTheDocument();
	});

	it("isOpenがfalseの場合、ダイアログが表示されない", () => {
		render(<EditExpenseDialog {...defaultProps} isOpen={false} />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("transactionがnullの場合、何も表示されない", () => {
		render(<EditExpenseDialog {...defaultProps} transaction={null} />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("初期値が正しくフォームに設定される", () => {
		render(<EditExpenseDialog {...defaultProps} />);

		// 金額
		const amountInput = screen.getByLabelText(/金額（円）/);
		expect(amountInput).toHaveValue(1000);

		// 説明
		const descriptionInput = screen.getByLabelText("説明（任意）");
		expect(descriptionInput).toHaveValue("昼食代");

		// 日付
		const dateInput = screen.getByLabelText(/日付/);
		expect(dateInput).toHaveValue("2024-01-15");

		// カテゴリ
		const categorySelect = screen.getByLabelText("カテゴリ");
		expect(categorySelect).toHaveValue("1");
	});

	it("フォーム送信時にonSubmitが正しく呼ばれる", async () => {
		const user = userEvent.setup();
		render(<EditExpenseDialog {...defaultProps} />);

		// 金額を変更
		const amountInput = screen.getByLabelText(/金額（円）/);
		await user.clear(amountInput);
		await user.type(amountInput, "2000");

		// 送信ボタンをクリック
		const submitButton = screen.getByRole("button", { name: "更新" });
		await user.click(submitButton);

		await waitFor(() => {
			expect(defaultProps.onSubmit).toHaveBeenCalledWith("tx-1", {
				amount: 2000,
				type: "expense",
				description: "昼食代",
				date: "2024-01-15",
				categoryId: "1",
			});
		});
	});

	it("キャンセルボタンクリック時にonCloseが呼ばれる", async () => {
		const user = userEvent.setup();
		render(<EditExpenseDialog {...defaultProps} />);

		const cancelButton = screen.getByRole("button", { name: "キャンセル" });
		await user.click(cancelButton);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	it("ダイアログのクローズボタンクリック時にonCloseが呼ばれる", async () => {
		const user = userEvent.setup();
		render(<EditExpenseDialog {...defaultProps} />);

		// Dialogコンポーネントのクローズボタンを探す
		const closeButton = screen.getByRole("button", { name: "閉じる" });
		await user.click(closeButton);

		expect(defaultProps.onClose).toHaveBeenCalled();
	});

	it("送信中はオーバーレイクリックでダイアログが閉じない", async () => {
		const { container } = render(
			<EditExpenseDialog {...defaultProps} isSubmitting={true} />,
		);

		// オーバーレイ要素を取得（Dialogコンポーネントの実装に基づく）
		const overlay = container.querySelector('[data-testid="dialog-overlay"]');
		if (overlay) {
			fireEvent.click(overlay);
		}

		expect(defaultProps.onClose).not.toHaveBeenCalled();
	});

	it("送信エラー時にエラーメッセージが表示される", async () => {
		const user = userEvent.setup();
		const onSubmitMock = vi
			.fn()
			.mockRejectedValue(new Error("ネットワークエラー"));

		render(<EditExpenseDialog {...defaultProps} onSubmit={onSubmitMock} />);

		// 送信ボタンをクリック
		const submitButton = screen.getByRole("button", { name: "更新" });
		await user.click(submitButton);

		// エラーメッセージが表示される
		await waitFor(() => {
			expect(screen.getByText("更新に失敗しました")).toBeInTheDocument();
			expect(screen.getByText("ネットワークエラー")).toBeInTheDocument();
		});

		// ダイアログは閉じない
		expect(defaultProps.onClose).not.toHaveBeenCalled();
	});

	it("送信成功時にダイアログが閉じる", async () => {
		const user = userEvent.setup();
		const onSubmitMock = vi.fn().mockResolvedValue(undefined);

		render(<EditExpenseDialog {...defaultProps} onSubmit={onSubmitMock} />);

		// 送信ボタンをクリック
		const submitButton = screen.getByRole("button", { name: "更新" });
		await user.click(submitButton);

		// onSubmitが呼ばれた後、onCloseが呼ばれる
		await waitFor(() => {
			expect(onSubmitMock).toHaveBeenCalled();
			expect(defaultProps.onClose).toHaveBeenCalled();
		});
	});

	it("カテゴリがpropsで提供されない場合、グローバル設定から取得される", () => {
		render(<EditExpenseDialog {...defaultProps} categories={undefined} />);

		// カテゴリセレクトボックスが表示される
		const categorySelect = screen.getByLabelText("カテゴリ");
		expect(categorySelect).toBeInTheDocument();

		// グローバル設定のカテゴリが選択肢として存在することを確認
		// （実際のオプション数はグローバル設定に依存）
		const options = screen.getAllByRole("option");
		expect(options.length).toBeGreaterThan(0);
	});

	it("ダイアログが開かれた時にエラー状態がクリアされる", async () => {
		const user = userEvent.setup();
		const onSubmitMock = vi
			.fn()
			.mockRejectedValueOnce(new Error("エラー1"))
			.mockResolvedValueOnce(undefined);

		const { rerender } = render(
			<EditExpenseDialog {...defaultProps} onSubmit={onSubmitMock} />,
		);

		// 最初の送信でエラーを発生させる
		const submitButton = screen.getByRole("button", { name: "更新" });
		await user.click(submitButton);

		// エラーメッセージが表示される
		await waitFor(() => {
			expect(screen.getByText("エラー1")).toBeInTheDocument();
		});

		// ダイアログを一度閉じて再度開く
		rerender(
			<EditExpenseDialog
				{...defaultProps}
				isOpen={false}
				onSubmit={onSubmitMock}
			/>,
		);
		rerender(
			<EditExpenseDialog
				{...defaultProps}
				isOpen={true}
				onSubmit={onSubmitMock}
			/>,
		);

		// エラーメッセージがクリアされている
		expect(screen.queryByText("エラー1")).not.toBeInTheDocument();
	});
});
