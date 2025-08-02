import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, NewSubscriptionDialogProps } from "../../lib/api/types";
import { NewSubscriptionDialog } from "./NewSubscriptionDialog";

// モックデータの定義
const mockCategories: Category[] = [
	{ 
		id: "1", 
		name: "交通費", 
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z"
	},
	{ 
		id: "2", 
		name: "光熱費", 
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z"
	},
	{ 
		id: "3", 
		name: "食費", 
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z"
	},
	{ 
		id: "4", 
		name: "その他", 
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z"
	},
	{ 
		id: "5", 
		name: "仕事・ビジネス", 
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z"
	},
];

/**
 * NewSubscriptionDialogコンポーネントのテスト
 *
 * テスト内容:
 * - 送信処理とエラーハンドリング（重点）
 * - 送信中の状態管理
 * - ダイアログの開閉ロジック
 * - バリデーションとのインテグレーション
 *
 * 注: UI表示・インタラクションテストはStorybookに移行済み
 */

// createPortalのモック
vi.mock("react-dom", async () => {
	const actual = await vi.importActual("react-dom");
	return {
		...actual,
		createPortal: (children: React.ReactNode) => children,
	};
});

describe("NewSubscriptionDialog", () => {
	const defaultProps: NewSubscriptionDialogProps = {
		isOpen: true,
		onClose: vi.fn(),
		onSubmit: vi.fn(),
		isSubmitting: false,
		categories: mockCategories,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("送信状態の処理", () => {
		it("送信中はダイアログクローズが無効化される", () => {
			render(<NewSubscriptionDialog {...defaultProps} isSubmitting={true} />);

			// ESCキーでクローズできないことを確認
			fireEvent.keyDown(document, { key: "Escape" });
			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});
	});

	describe("フォーム送信処理", () => {
		it("有効なデータでフォームを送信した場合、onSubmitとonCloseが呼ばれる", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			// フォームに値を入力
			await user.type(screen.getByLabelText(/サービス名/), "Netflix");
			await user.type(screen.getByLabelText(/料金/), "1490");

			// 次回請求日を設定
			const nextMonth = new Date();
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			const nextMonthString = nextMonth.toISOString().split("T")[0];
			await user.type(screen.getByLabelText(/次回請求日/), nextMonthString);

			// カテゴリを選択
			await user.selectOptions(screen.getByLabelText(/カテゴリ/), "3");

			// 登録ボタンをクリック
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// onSubmitが正しいデータで呼ばれることを確認
			expect(defaultProps.onSubmit).toHaveBeenCalledWith({
				name: "Netflix",
				amount: 1490,
				billingCycle: "monthly",
				nextBillingDate: nextMonthString,
				categoryId: "3",
				isActive: true,
				description: "",
			});

			// onCloseも呼ばれることを確認（送信成功後の自動クローズ）
			expect(defaultProps.onClose).toHaveBeenCalledOnce();
		});

		it("無効なデータでフォームを送信した場合、onSubmitは呼ばれない", async () => {
			const user = userEvent.setup();
			render(<NewSubscriptionDialog {...defaultProps} />);

			// 空のフォームで送信ボタンをクリック
			const submitButton = screen.getByRole("button", { name: "登録" });
			await user.click(submitButton);

			// バリデーションエラーが表示されることを確認
			await waitFor(() => {
				expect(screen.getByText("サービス名は必須です")).toBeInTheDocument();
			});

			// onSubmitは呼ばれないことを確認
			expect(defaultProps.onSubmit).not.toHaveBeenCalled();
			expect(defaultProps.onClose).not.toHaveBeenCalled();
		});
	});

	describe("エッジケース処理", () => {
		it("カテゴリが空の場合でも正常に動作する", () => {
			render(<NewSubscriptionDialog {...defaultProps} categories={[]} />);
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		it("ダイアログが閉じている状態でのプロパティ変更が安全", () => {
			const { rerender } = render(
				<NewSubscriptionDialog {...defaultProps} isOpen={false} />,
			);

			// 閉じた状態でsubmitting状態を変更
			rerender(
				<NewSubscriptionDialog
					{...defaultProps}
					isOpen={false}
					isSubmitting={true}
				/>,
			);

			// エラーが発生しないことを確認
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});
});
