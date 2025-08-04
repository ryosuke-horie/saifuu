/**
 * 収入ページ統合テスト
 *
 * すべてのコンポーネントの連携、フィルター機能、CRUD操作、
 * ページネーション、レスポンシブレイアウトなどの統合的な動作を検証
 */

import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import type { TransactionWithCategory } from "@/lib/api/types";
import type { Category } from "@/types/category";

// モック設定を外部化
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

// Next.js Router モック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
		replace: mockReplace,
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => mockSearchParams,
	usePathname: () => "/income",
}));

// メディアクエリフックのモック
vi.mock("@/hooks/useMediaQuery", () => ({
	useIsMobile: vi.fn(() => false),
}));

// APIクライアントのモック
vi.mock("@/lib/api/client", () => ({
	apiClient: {
		transactions: {
			list: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

// カテゴリAPIのモック
vi.mock("@/lib/api/categories/api", () => ({
	fetchCategories: vi.fn(),
}));

import { useIsMobile } from "@/hooks/useMediaQuery";
// インポート（モック後）
import { fetchCategories } from "@/lib/api/categories/api";
import { apiClient } from "@/lib/api/client";
import IncomePage from "../page";

describe("IncomePage 統合テスト", () => {
	// テストデータ（最小限）
	const mockCategories: Category[] = [
		{
			id: "salary",
			name: "給与",
			type: "income",
			color: "#10b981",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: "bonus",
			name: "ボーナス",
			type: "income",
			color: "#059669",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	];

	const mockIncomes: TransactionWithCategory[] = [
		{
			id: "1",
			amount: 300000,
			date: "2024-01-25",
			description: "1月給与",
			type: "income",
			category: mockCategories[0],
			categoryId: "salary",
			createdAt: "2024-01-25T00:00:00Z",
			updatedAt: "2024-01-25T00:00:00Z",
		},
		{
			id: "2",
			amount: 150000,
			date: "2024-01-20",
			description: "冬季ボーナス",
			type: "income",
			category: mockCategories[1],
			categoryId: "bonus",
			createdAt: "2024-01-20T00:00:00Z",
			updatedAt: "2024-01-20T00:00:00Z",
		},
	];

	// API応答のデフォルト設定
	const setupApiMocks = () => {
		// トランザクションリストのモック
		(apiClient.transactions.list as Mock).mockResolvedValue({
			data: mockIncomes,
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 2,
				itemsPerPage: 10,
			},
		});

		// カテゴリのモック
		(fetchCategories as Mock).mockResolvedValue(mockCategories);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
		setupApiMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("コンポーネントレンダリング", () => {
		it("すべての主要コンポーネントが表示される", async () => {
			render(<IncomePage />);

			await waitFor(() => {
				// ページタイトル
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();
			});

			// 統計コンポーネント
			expect(screen.getByText(/今月の収入/)).toBeInTheDocument();
			expect(screen.getByText(/先月の収入/)).toBeInTheDocument();
			expect(screen.getByText(/今年の収入/)).toBeInTheDocument();

			// フィルターセクション
			expect(screen.getByText("絞り込み条件")).toBeInTheDocument();

			// 収入登録フォーム
			expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			expect(screen.getByLabelText(/金額/)).toBeInTheDocument();

			// 収入一覧
			expect(screen.getByText("収入一覧")).toBeInTheDocument();
		});

		it("収入データが一覧に表示される", async () => {
			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
				expect(screen.getByText("冬季ボーナス")).toBeInTheDocument();
			});
		});
	});

	describe("フィルター機能", () => {
		it("カテゴリフィルターが動作する", async () => {
			const user = userEvent.setup();
			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// カテゴリフィルターを選択
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "salary");

			// APIが再呼び出しされることを確認
			await waitFor(() => {
				expect(apiClient.transactions.list).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "income",
					}),
				);
			});
		});

		it("日付範囲フィルターが動作する", async () => {
			const user = userEvent.setup();
			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// 開始日を入力
			const dateFromInput = screen.getByLabelText(/開始日/);
			await user.type(dateFromInput, "2024-01-01");

			// 終了日を入力
			const dateToInput = screen.getByLabelText(/終了日/);
			await user.type(dateToInput, "2024-01-31");

			// APIが再呼び出しされることを確認
			await waitFor(() => {
				expect(apiClient.transactions.list).toHaveBeenCalled();
			});
		});

		it("フィルターリセットが動作する", async () => {
			const user = userEvent.setup();
			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("絞り込み条件")).toBeInTheDocument();
			});

			// フィルターを設定
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "salary");

			// リセットボタンをクリック
			const resetButton = screen.getByRole("button", { name: /リセット/ });
			await user.click(resetButton);

			// フィルターがクリアされることを確認
			await waitFor(() => {
				expect(categorySelect).toHaveValue("");
			});
		});
	});

	describe("CRUD操作", () => {
		it("新規収入を登録できる", async () => {
			const user = userEvent.setup();
			(apiClient.transactions.create as Mock).mockResolvedValue({
				id: "new-1",
				amount: 80000,
				date: "2024-01-30",
				description: "臨時収入",
				type: "income",
				categoryId: "bonus",
				createdAt: "2024-01-30T00:00:00Z",
				updatedAt: "2024-01-30T00:00:00Z",
			});

			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText(/収入を登録/)).toBeInTheDocument();
			});

			// フォームに入力
			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "80000");

			const descriptionInput = screen.getByLabelText(/説明/);
			await user.type(descriptionInput, "臨時収入");

			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "bonus");

			// 登録ボタンをクリック
			const submitButton = screen.getByRole("button", { name: /登録/ });
			await user.click(submitButton);

			// APIが呼び出されることを確認
			await waitFor(() => {
				expect(apiClient.transactions.create).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "income",
						amount: 80000,
						description: "臨時収入",
						categoryId: "bonus",
					}),
				);
			});
		});

		it("収入を編集できる", async () => {
			const user = userEvent.setup();
			(apiClient.transactions.update as Mock).mockResolvedValue({
				...mockIncomes[0],
				amount: 350000,
			});

			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 編集ボタンをクリック
			const editButtons = screen.getAllByRole("button", { name: /編集/ });
			await user.click(editButtons[0]);

			// フォームが編集モードになることを確認
			await waitFor(() => {
				expect(screen.getByText(/収入を編集/)).toBeInTheDocument();
			});

			// 金額を変更
			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "350000");

			// 更新ボタンをクリック
			const updateButton = screen.getByRole("button", { name: /更新|登録/ });
			await user.click(updateButton);

			// APIが呼び出されることを確認
			await waitFor(() => {
				expect(apiClient.transactions.update).toHaveBeenCalledWith(
					"1",
					expect.objectContaining({
						amount: 350000,
					}),
				);
			});
		});

		it("収入を削除できる", async () => {
			const user = userEvent.setup();
			(apiClient.transactions.delete as Mock).mockResolvedValue({});

			render(<IncomePage />);

			await waitFor(() => {
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 削除ボタンをクリック
			const deleteButtons = screen.getAllByRole("button", { name: /削除/ });
			await user.click(deleteButtons[0]);

			// 確認ダイアログが表示される
			await waitFor(() => {
				expect(screen.getByText(/削除を確認/)).toBeInTheDocument();
			});

			// 削除を確定
			const confirmButton = screen.getByRole("button", { name: /削除する/ });
			await user.click(confirmButton);

			// APIが呼び出されることを確認
			await waitFor(() => {
				expect(apiClient.transactions.delete).toHaveBeenCalledWith("1");
			});
		});
	});

	describe("ページネーション", () => {
		it("ページネーションコンポーネントが表示される", async () => {
			// ページネーション用のデータ設定
			(apiClient.transactions.list as Mock).mockResolvedValue({
				data: mockIncomes,
				pagination: {
					currentPage: 1,
					totalPages: 2,
					totalItems: 15,
					itemsPerPage: 10,
				},
			});

			render(<IncomePage />);

			await waitFor(() => {
				// ページネーションボタン
				expect(
					screen.getByRole("button", { name: /前へ/ }),
				).toBeInTheDocument();
				expect(
					screen.getByRole("button", { name: /次へ/ }),
				).toBeInTheDocument();

				// ページ情報
				expect(screen.getByText(/15件/)).toBeInTheDocument();
			});
		});

		it("ページネーションが動作する", async () => {
			const user = userEvent.setup();

			// 初期データ
			(apiClient.transactions.list as Mock).mockResolvedValue({
				data: mockIncomes,
				pagination: {
					currentPage: 1,
					totalPages: 2,
					totalItems: 15,
					itemsPerPage: 10,
				},
			});

			render(<IncomePage />);

			await waitFor(() => {
				expect(
					screen.getByRole("button", { name: /次へ/ }),
				).toBeInTheDocument();
			});

			// 2ページ目のデータを設定
			(apiClient.transactions.list as Mock).mockResolvedValue({
				data: [],
				pagination: {
					currentPage: 2,
					totalPages: 2,
					totalItems: 15,
					itemsPerPage: 10,
				},
			});

			// 次へボタンをクリック
			const nextButton = screen.getByRole("button", { name: /次へ/ });
			await user.click(nextButton);

			// APIが2ページ目のデータで呼び出される
			await waitFor(() => {
				expect(apiClient.transactions.list).toHaveBeenCalledWith(
					expect.objectContaining({
						page: 2,
					}),
				);
			});
		});
	});

	describe("レスポンシブレイアウト", () => {
		it("モバイルレイアウトで適切に表示される", async () => {
			// モバイルモードに設定
			(useIsMobile as Mock).mockReturnValue(true);

			render(<IncomePage />);

			await waitFor(() => {
				// モバイルではグリッドレイアウトではなく縦並びになる
				const filterSection = screen.getByText("絞り込み条件").closest("div");
				const parentDiv = filterSection?.parentElement;

				// space-y-6クラスが適用されていることを確認（モバイルレイアウト）
				expect(parentDiv).toHaveClass("space-y-6");
				expect(parentDiv).not.toHaveClass("grid", "grid-cols-2");
			});
		});

		it("デスクトップレイアウトで適切に表示される", async () => {
			// デスクトップモードに設定
			(useIsMobile as Mock).mockReturnValue(false);

			render(<IncomePage />);

			await waitFor(() => {
				// デスクトップではグリッドレイアウトになる
				const filterSection = screen.getByText("絞り込み条件").closest("div");
				const parentDiv = filterSection?.parentElement;

				// grid grid-cols-2クラスが適用されていることを確認（デスクトップレイアウト）
				expect(parentDiv).toHaveClass("grid", "grid-cols-2");
				expect(parentDiv).not.toHaveClass("space-y-6");
			});
		});
	});

	describe("エラーハンドリング", () => {
		it("API エラー時にエラーメッセージが表示される", async () => {
			(apiClient.transactions.list as Mock).mockRejectedValue(
				new Error("ネットワークエラー"),
			);

			render(<IncomePage />);

			await waitFor(() => {
				// エラーメッセージが表示される
				const errorMessage = screen.queryByText(/エラー|失敗|問題/);
				expect(errorMessage).toBeInTheDocument();
			});
		});

		it("カテゴリ取得エラー時でもページが表示される", async () => {
			(fetchCategories as Mock).mockRejectedValue(
				new Error("カテゴリ取得エラー"),
			);

			render(<IncomePage />);

			await waitFor(() => {
				// ページタイトルは表示される
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();

				// フォームは表示されるがカテゴリ選択は空
				expect(screen.getByLabelText(/金額/)).toBeInTheDocument();
				const categorySelect = screen.getByLabelText(/カテゴリ/);
				expect(categorySelect).toBeInTheDocument();
				expect(categorySelect.children.length).toBe(1); // 空のオプションのみ
			});
		});
	});

	describe("統合フロー", () => {
		it("基本的な収入管理フローが動作する", async () => {
			const user = userEvent.setup();

			render(<IncomePage />);

			// 1. 初期表示を確認
			await waitFor(() => {
				expect(
					screen.getByRole("heading", { name: "収入管理" }),
				).toBeInTheDocument();
				expect(screen.getByText("1月給与")).toBeInTheDocument();
			});

			// 2. フィルターを適用
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "salary");

			// 3. 新規収入を登録
			(apiClient.transactions.create as Mock).mockResolvedValue({
				id: "flow-new",
				amount: 250000,
				date: "2024-01-28",
				description: "追加給与",
				type: "income",
				categoryId: "salary",
				createdAt: "2024-01-28T00:00:00Z",
				updatedAt: "2024-01-28T00:00:00Z",
			});

			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "250000");

			const submitButton = screen.getByRole("button", { name: /登録/ });
			await user.click(submitButton);

			// 4. データが更新される
			await waitFor(() => {
				expect(apiClient.transactions.create).toHaveBeenCalled();
				expect(apiClient.transactions.list).toHaveBeenCalled();
			});

			// 5. フィルターをリセット
			const resetButton = screen.getByRole("button", { name: /リセット/ });
			await user.click(resetButton);

			await waitFor(() => {
				expect(categorySelect).toHaveValue("");
			});
		});
	});
});
