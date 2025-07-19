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
	useCategories: vi.fn(),
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
	EditExpenseDialog: vi.fn(
		({ isOpen, onClose, onSubmit, isSubmitting, transaction }) => {
			if (!isOpen) return null;
			return (
				<div data-testid="edit-expense-dialog">
					<p>取引編集: {transaction?.description}</p>
					<button type="button" onClick={onClose}>
						閉じる
					</button>
					<button
						type="button"
						onClick={() =>
							onSubmit(transaction.id, {
								amount: 2000,
								type: "expense",
								description: "編集済み",
								date: "2024-01-02",
								categoryId: "category-1",
							})
						}
						disabled={isSubmitting}
					>
						{isSubmitting ? "更新中..." : "更新"}
					</button>
				</div>
			);
		},
	),
	ExpenseList: vi.fn(({ transactions, isLoading, onEdit, onDelete }) => (
		<div data-testid="expense-list">
			{isLoading ? (
				<p>読み込み中...</p>
			) : (
				<div>
					{transactions?.map((t: any) => (
						<div key={t.id} data-testid={`transaction-${t.id}`}>
							<span>{t.description}</span>
							<span>{t.amount}</span>
							<button type="button" onClick={() => onEdit(t)}>
								編集
							</button>
							<button type="button" onClick={() => onDelete(t.id)}>
								削除
							</button>
						</div>
					))}
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

import { useCategories, useExpenses } from "../../hooks";

const mockUseExpenses = vi.mocked(useExpenses);
const mockUseCategories = vi.mocked(useCategories);

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
		description: "書籍代",
		date: "2024-01-02",
		type: "expense" as const,
		category: null,
		createdAt: "2024-01-02T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
	},
];

describe("ExpensesPage", () => {
	const mockRefetch = vi.fn();
	const mockCreateExpenseMutation = vi.fn();
	const mockUpdateExpenseMutation = vi.fn();
	const mockDeleteExpenseMutation = vi.fn();

	const defaultMockReturn = {
		expenses: mockExpenses,
		loading: false,
		error: null,
		operationLoading: false,
		refetch: mockRefetch,
		createExpenseMutation: mockCreateExpenseMutation,
		updateExpenseMutation: mockUpdateExpenseMutation,
		deleteExpenseMutation: mockDeleteExpenseMutation,
		getExpenseById: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseExpenses.mockReturnValue(defaultMockReturn);
		mockUseCategories.mockReturnValue({
			categories: [
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
			],
			loading: false,
			error: null,
			refetch: vi.fn(),
		});
	});

	describe("初期表示", () => {
		it("ページタイトルが表示される", () => {
			render(<ExpensesPage />);
			expect(screen.getByText("支出管理")).toBeInTheDocument();
		});

		it("新規登録ボタンが表示される", () => {
			render(<ExpensesPage />);
			expect(screen.getByTestId("new-expense-button")).toBeInTheDocument();
		});

		it("統計情報が正しく計算される", () => {
			render(<ExpensesPage />);

			// 支出合計のラベルを確認
			expect(screen.getByText("支出合計")).toBeInTheDocument();

			// 支出合計: 1000円 + 5000円 = 6000円
			// text-red-600クラスを持つ要素を探す
			const expenseTotalElement = screen.getByText((content, element) => {
				return (
					!!element?.className?.includes("text-red-600") &&
					content.includes("￥6,000")
				);
			});
			expect(expenseTotalElement).toBeInTheDocument();

			// 取引件数: 2件
			expect(screen.getByText("取引件数")).toBeInTheDocument();
			const transactionCountElement = screen.getByText((content, element) => {
				return (
					!!element?.className?.includes("text-gray-900") && content === "2件"
				);
			});
			expect(transactionCountElement).toBeInTheDocument();
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
			expect(loadingMessages).toHaveLength(3); // 支出統計、取引件数、リスト
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

	describe("編集", () => {
		it("編集ボタンをクリックすると編集ダイアログが表示される", () => {
			render(<ExpensesPage />);

			const editButton = screen.getAllByText("編集")[0];
			fireEvent.click(editButton);

			expect(screen.getByTestId("edit-expense-dialog")).toBeInTheDocument();
			expect(screen.getByText("取引編集: コーヒー")).toBeInTheDocument();
		});

		it("編集ダイアログで更新するとupdateExpenseMutationが呼ばれる", async () => {
			render(<ExpensesPage />);

			// 編集ボタンをクリック
			const editButton = screen.getAllByText("編集")[0];
			fireEvent.click(editButton);

			// 更新ボタンをクリック
			const updateButton = screen.getByText("更新");
			fireEvent.click(updateButton);

			await waitFor(() => {
				expect(mockUpdateExpenseMutation).toHaveBeenCalledWith("1", {
					amount: 2000,
					type: "expense",
					description: "編集済み",
					date: "2024-01-02",
					categoryId: "category-1",
				});
			});
		});

		it("編集ダイアログを閉じるとダイアログが非表示になる", () => {
			render(<ExpensesPage />);

			// 編集ボタンをクリック
			const editButton = screen.getAllByText("編集")[0];
			fireEvent.click(editButton);

			// 閉じるボタンをクリック
			const closeButton = screen.getByText("閉じる");
			fireEvent.click(closeButton);

			expect(
				screen.queryByTestId("edit-expense-dialog"),
			).not.toBeInTheDocument();
		});

		it("操作中は更新ボタンが無効化される", () => {
			mockUseExpenses.mockReturnValue({
				...defaultMockReturn,
				operationLoading: true,
			});
			render(<ExpensesPage />);

			// 編集ボタンをクリック
			const editButton = screen.getAllByText("編集")[0];
			fireEvent.click(editButton);

			const updateButton = screen.getByText("更新中...");
			expect(updateButton).toBeDisabled();
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

			// 確認ダイアログで削除を実行（削除ボタンが複数あるため、最後のものを選択）
			const deleteButtons = screen.getAllByText("削除");
			const confirmButton = deleteButtons[deleteButtons.length - 1];
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

			// 支出合計の¥0が表示される
			const expenseTotalElement = screen.getByText((content, element) => {
				return (
					!!element?.className?.includes("text-red-600") &&
					content.includes("￥0")
				);
			});
			expect(expenseTotalElement).toBeInTheDocument();

			// 取引件数が0件で表示される
			const transactionCountElement = screen.getByText((content, element) => {
				return (
					!!element?.className?.includes("text-gray-900") && content === "0件"
				);
			});
			expect(transactionCountElement).toBeInTheDocument();
		});

		it("支出合計が表示される", () => {
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

			// 支出合計が赤文字で表示される
			const expenseTotalElement = screen.getByText((content, element) => {
				return (
					!!element?.className?.includes("text-red-600") &&
					content.includes("￥10,000")
				);
			});
			expect(expenseTotalElement).toBeInTheDocument();
		});
	});
});
