/**
 * ExpenseListコンポーネントのテスト
 * 
 * TDD（Test-Driven Development）アプローチに従った実装
 * Red-Green-Refactorサイクルで品質を担保
 * 
 * テスト観点:
 * - 基本的なレンダリング
 * - ローディング状態の表示
 * - エラー状態の表示
 * - 空状態の表示
 * - データ一覧の正常表示
 * - レスポンシブデザイン
 * - 編集・削除機能
 * - アクセシビリティ
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { expect, describe, it, vi } from "vitest";
import type { Transaction } from "../../lib/api/types";
import { mockTransactions } from "../../../.storybook/mocks/data/transactions";
import { ExpenseList } from "./ExpenseList";

describe("ExpenseList", () => {
	describe("基本レンダリング", () => {
		it("コンポーネントが正常にレンダリングされる", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);
			
			// ヘッダー部分の表示確認
			expect(screen.getByText("取引一覧")).toBeInTheDocument();
			expect(screen.getByText("支出・収入の履歴")).toBeInTheDocument();
		});

		it("テーブルヘッダーが正しく表示される", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);

			// テーブルヘッダーの確認
			expect(screen.getByText("日付")).toBeInTheDocument();
			expect(screen.getByText("金額")).toBeInTheDocument();
			expect(screen.getByText("カテゴリ")).toBeInTheDocument();
			expect(screen.getByText("説明")).toBeInTheDocument();
			expect(screen.getByText("操作")).toBeInTheDocument();
		});
	});

	describe("ローディング状態", () => {
		it("ローディング中の表示が正しく動作する", () => {
			render(
				<ExpenseList 
					transactions={[]}
					isLoading={true}
					error={null}
				/>
			);

			expect(screen.getByText("読み込み中...")).toBeInTheDocument();
			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		});
	});

	describe("エラー状態", () => {
		it("エラーメッセージが正しく表示される", () => {
			const errorMessage = "データの取得に失敗しました";
			render(
				<ExpenseList 
					transactions={[]}
					isLoading={false}
					error={errorMessage}
				/>
			);

			expect(screen.getByText(`エラー: ${errorMessage}`)).toBeInTheDocument();
		});
	});

	describe("空状態", () => {
		it("取引データが空の場合の表示が正しい", () => {
			render(
				<ExpenseList 
					transactions={[]}
					isLoading={false}
					error={null}
				/>
			);

			expect(screen.getByText("登録されている取引がありません")).toBeInTheDocument();
			expect(screen.getByText("新規登録ボタンから追加してください")).toBeInTheDocument();
		});
	});

	describe("データ表示", () => {
		it("取引データが正しく表示される", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);

			// 支出データの確認（負の金額表示）
			expect(screen.getByText("-¥1,000")).toBeInTheDocument();
			expect(screen.getByText("昼食代（コンビニ弁当）")).toBeInTheDocument();

			// 収入データの確認（正の金額表示）
			expect(screen.getByText("+¥50,000")).toBeInTheDocument();
			expect(screen.getByText("月次給与")).toBeInTheDocument();
		});

		it("日付が正しくフォーマットされて表示される", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);

			// 日付フォーマットの確認（YYYY/MM/DD形式）
			expect(screen.getByText("2025/07/09")).toBeInTheDocument();
			expect(screen.getByText("2025/07/01")).toBeInTheDocument();
		});

		it("カテゴリが正しく表示される", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);

			expect(screen.getByText("給与")).toBeInTheDocument();
			expect(screen.getByText("エンターテイメント")).toBeInTheDocument();
		});
	});

	describe("インタラクション", () => {
		it("編集ボタンが機能する", () => {
			const mockOnEdit = vi.fn();
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					onEdit={mockOnEdit}
				/>
			);

			const editButtons = screen.getAllByText("編集");
			fireEvent.click(editButtons[0]);

			expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
		});

		it("削除ボタンが機能する", () => {
			const mockOnDelete = vi.fn();
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					onDelete={mockOnDelete}
				/>
			);

			const deleteButtons = screen.getAllByText("削除");
			fireEvent.click(deleteButtons[0]);

			expect(mockOnDelete).toHaveBeenCalledWith(mockTransactions[0].id);
		});

		it("更新ボタンが機能する", () => {
			const mockOnRefresh = vi.fn();
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					onRefresh={mockOnRefresh}
				/>
			);

			const refreshButton = screen.getByText("更新");
			fireEvent.click(refreshButton);

			expect(mockOnRefresh).toHaveBeenCalled();
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIA属性が設定されている", () => {
			render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>
			);

			// テーブルのアクセシビリティ
			const table = screen.getByRole("table");
			expect(table).toBeInTheDocument();

			// ヘッダーセルの確認
			const columnHeaders = screen.getAllByRole("columnheader");
			expect(columnHeaders).toHaveLength(5);

			// ボタンのアクセシビリティ
			const buttons = screen.getAllByRole("button");
			expect(buttons.length).toBeGreaterThan(0);
		});
	});

	describe("プロパティ", () => {
		it("カスタムクラス名が適用される", () => {
			const customClassName = "custom-expense-list";
			const { container } = render(
				<ExpenseList 
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					className={customClassName}
				/>
			);

			expect(container.firstChild).toHaveClass(customClassName);
		});
	});
});