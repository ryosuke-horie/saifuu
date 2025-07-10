/**
 * 支出管理ページのテスト
 *
 * 関連Issue: #93 支出管理メインページ実装
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExpensesPage from "./page";

// フックのモック
vi.mock("../../hooks", () => ({
	useExpenses: vi.fn(),
}));

// カテゴリユーティリティのモック
vi.mock("../../utils/categories", () => ({
	convertGlobalCategoriesToCategory: vi.fn(() => [
		{
			id: "category-1",
			name: "食費",
			type: "expense",
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "category-2",
			name: "交通費",
			type: "expense",
			color: "#00FF00",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	]),
}));

// コンポーネントのモック
vi.mock("../../components/expenses", () => ({
	DeleteConfirmDialog: vi.fn(
		({ isOpen, onClose, onConfirm, itemDescription, isDeleting }) => {
			if (!isOpen) return null;
			return (
				<div data-testid="delete-confirm-dialog">
					<p>{itemDescription}を削除してもよろしいですか？</p>
					<button type="button" onClick={onClose}>
						キャンセル
					</button>
					<button type="button" onClick={onConfirm} disabled={isDeleting}>
						{isDeleting ? "削除中..." : "削除"}
					</button>
				</div>
			);
		},
	),
	ExpenseList: vi.fn(({ transactions, isLoading, onRefresh, onDelete }) => (
		<div data-testid="expense-list">
			{isLoading ? (
				<p>読み込み中...</p>
			) : (
				<div>
					{transactions?.map((t: any) => (
						<div key={t.id} data-testid={`transaction-${t.id}`}>
							<span>{t.description}</span>
							<span>{t.amount}</span>
							<button type="button" onClick={() => onDelete(t.id)}>
								削除
							</button>
						</div>
					))}
					<button type="button" onClick={onRefresh}>
						更新
					</button>
				</div>
			)}
		</div>
	)),
	NewExpenseButton: vi.fn(({ onClick }) => (
		<button type="button" onClick={onClick} data-testid="new-expense-button">
			新規登録
		</button>
	)),
	NewExpenseDialog: vi.fn(({ isOpen, onClose, onSubmit, isSubmitting }) => {
		if (!isOpen) return null;
		return (
			<div data-testid="new-expense-dialog">
				<button type="button" onClick={onClose}>
					閉じる
				</button>
				<button
					type="button"
					onClick={() =>
						onSubmit({
							amount: 1000,
							description: "テスト",
							date: "2024-01-01",
						})
					}
					disabled={isSubmitting}
				>
					{isSubmitting ? "送信中..." : "送信"}
				</button>
			</div>
		);
	}),
}));

import { useExpenses } from "../../hooks";

const mockUseExpenses = vi.mocked(useExpenses);

// モックデータ
const mockExpenses = [
	{
		id: "1",
		amount: 1000,
		description: "コーヒー",
		date: "2024-01-01",
		type: "expense" as const,
		category: {
			id: "category-1",
			name: "食費",
			type: "expense" as const,
			color: "#FF0000",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: "2",
		amount: 5000,
		description: "給料",
		date: "2024-01-02",
		type: "income" as const,
		category: null,
		createdAt: "2024-01-02T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
	},
];

describe("ExpensesPage", () => {
	const mockRefetch = vi.fn();
	const mockCreateExpenseMutation = vi.fn();
	const mockDeleteExpenseMutation = vi.fn();

	const defaultMockReturn = {
		expenses: mockExpenses,
		loading: false,
		error: null,
		operationLoading: false,
		refetch: mockRefetch,
		createExpenseMutation: mockCreateExpenseMutation,
		updateExpenseMutation: vi.fn(),
		deleteExpenseMutation: mockDeleteExpenseMutation,
		getExpenseById: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseExpenses.mockReturnValue(defaultMockReturn);
	});

	describe("初期表示", () => {
		it("ページタイトルが表示される", () => {
			render(<ExpensesPage />);
			expect(screen.getByText("支出・収入管理")).toBeInTheDocument();
		});

		it("新規登録ボタンが表示される", () => {
			render(<ExpensesPage />);
			expect(screen.getByTestId("new-expense-button")).toBeInTheDocument();
		});

		it("統計情報が正しく計算される", () => {
			render(<ExpensesPage />);
			// 支出合計: 1000円
			expect(screen.getByText("¥1,000")).toBeInTheDocument();
			// 収入合計: 5000円
			expect(screen.getByText("¥5,000")).toBeInTheDocument();
			// 収支バランス: +4000円
			expect(screen.getByText("+¥4,000")).toBeInTheDocument();
		});
	});

	describe("ローディング状態", () => {
		it("ローディング中は統計情報にローディングメッセージが表示される", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				loading: true,
			});
			render(<ExpensesPage />);

			const loadingMessages = screen.getAllByText("読み込み中...");
			expect(loadingMessages).toHaveLength(4); // 支出、収入、収支、リスト
		});
	});

	describe("エラー状態", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "データの取得に失敗しました";
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				error: errorMessage,
			});
			render(<ExpensesPage />);

			expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("再読み込みボタンをクリックするとrefetchが呼ばれる", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				error: "エラー",
			});
			render(<ExpensesPage />);

			const retryButton = screen.getByText("再読み込み");
			fireEvent.click(retryButton);

			expect(mockRefetch).toHaveBeenCalledTimes(1);
		});
	});

	describe("新規登録", () => {
		it("新規登録ボタンをクリックするとダイアログが開く", () => {
			render(<ExpensesPage />);

			const newButton = screen.getByTestId("new-expense-button");
			fireEvent.click(newButton);

			expect(screen.getByTestId("new-expense-dialog")).toBeInTheDocument();
		});

		it("ダイアログで送信するとcreateExpenseMutationが呼ばれる", async () => {
			render(<ExpensesPage />);

			// ダイアログを開く
			fireEvent.click(screen.getByTestId("new-expense-button"));

			// 送信ボタンをクリック
			const submitButton = screen.getByText("送信");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockCreateExpenseMutation).toHaveBeenCalledWith({
					amount: 1000,
					description: "テスト",
					date: "2024-01-01",
				});
			});
		});

		it("操作中はボタンが無効化される", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				operationLoading: true,
			});
			render(<ExpensesPage />);

			// ダイアログを開く
			fireEvent.click(screen.getByTestId("new-expense-button"));

			const submitButton = screen.getByText("送信中...");
			expect(submitButton).toBeDisabled();
		});
	});

	describe("削除", () => {
		it("削除ボタンをクリックすると確認ダイアログが表示される", () => {
			render(<ExpensesPage />);

			const deleteButton = screen.getAllByText("削除")[0];
			fireEvent.click(deleteButton);

			expect(screen.getByTestId("delete-confirm-dialog")).toBeInTheDocument();
			expect(
				screen.getByText("この取引を削除してもよろしいですか？"),
			).toBeInTheDocument();
		});

		it("確認ダイアログで削除を実行するとdeleteExpenseMutationが呼ばれる", async () => {
			render(<ExpensesPage />);

			// 削除ボタンをクリック
			const deleteButton = screen.getAllByText("削除")[0];
			fireEvent.click(deleteButton);

			// 確認ダイアログで削除を実行
			const confirmButton = screen.getByText("削除", { selector: "button" });
			fireEvent.click(confirmButton);

			await waitFor(() => {
				expect(mockDeleteExpenseMutation).toHaveBeenCalledWith("1");
			});
		});

		it("確認ダイアログでキャンセルすると何も起こらない", () => {
			render(<ExpensesPage />);

			// 削除ボタンをクリック
			const deleteButton = screen.getAllByText("削除")[0];
			fireEvent.click(deleteButton);

			// キャンセルボタンをクリック
			const cancelButton = screen.getByText("キャンセル");
			fireEvent.click(cancelButton);

			expect(mockDeleteExpenseMutation).not.toHaveBeenCalled();
			expect(
				screen.queryByTestId("delete-confirm-dialog"),
			).not.toBeInTheDocument();
		});
	});

	describe("統計情報の計算", () => {
		it("取引がない場合は0円が表示される", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				expenses: [],
			});
			render(<ExpensesPage />);

			expect(screen.getByText("¥0")).toBeInTheDocument();
		});

		it("収支がマイナスの場合は赤色で表示される", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				expenses: [
					{
						...mockExpenses[0],
						amount: 10000, // 支出を増やす
					},
				],
			});
			render(<ExpensesPage />);

			const balance = screen.getByText("-¥10,000");
			expect(balance.className).toContain("text-red-600");
		});
	});
});
