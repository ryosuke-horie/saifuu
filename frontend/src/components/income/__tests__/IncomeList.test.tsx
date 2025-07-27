/**
 * IncomeListコンポーネントのテスト
 *
 * 収入一覧表示の各種状態をテストする
 * - 正常な収入データの表示
 * - 空状態の表示
 * - ローディング状態の表示
 * - エラー状態の表示
 * - 編集・削除操作のコールバック
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../../lib/api/types";
import { IncomeList } from "../IncomeList";

describe("IncomeList", () => {
	afterEach(() => {
		cleanup();
	});

	// テスト用のダミー収入データ
	const mockIncomeTransactions: Transaction[] = [
		{
			id: "1",
			amount: 300000,
			type: "income",
			description: "12月給与",
			date: "2024-12-25",
			category: {
				id: "salary",
				name: "給与",
				type: "income",
				color: "#10b981",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			createdAt: "2024-12-25T00:00:00Z",
			updatedAt: "2024-12-25T00:00:00Z",
		},
		{
			id: "2",
			amount: 50000,
			type: "income",
			description: "ボーナス支給",
			date: "2024-12-10",
			category: {
				id: "bonus",
				name: "ボーナス",
				type: "income",
				color: "#059669",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			createdAt: "2024-12-10T00:00:00Z",
			updatedAt: "2024-12-10T00:00:00Z",
		},
		{
			id: "3",
			amount: 10000,
			type: "income",
			description: "副業収入",
			date: "2024-12-01",
			category: {
				id: "side_business",
				name: "副業",
				type: "income",
				color: "#34d399",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			createdAt: "2024-12-01T00:00:00Z",
			updatedAt: "2024-12-01T00:00:00Z",
		},
	];

	it("収入データを正しく表示する", () => {
		render(<IncomeList transactions={mockIncomeTransactions} />);

		// ヘッダーの確認
		expect(screen.getByText("収入一覧")).toBeInTheDocument();
		expect(screen.getByText("収入の履歴")).toBeInTheDocument();

		// テーブルヘッダーの確認
		expect(screen.getByText("日付")).toBeInTheDocument();
		expect(screen.getByText("金額")).toBeInTheDocument();
		expect(screen.getByText("カテゴリ")).toBeInTheDocument();
		expect(screen.getByText("説明")).toBeInTheDocument();
		expect(screen.getByText("操作")).toBeInTheDocument();

		// 収入データの表示確認（日付降順）
		const rows = screen.getAllByRole("row");
		// ヘッダー行を除く
		expect(rows).toHaveLength(4); // ヘッダー + 3データ行

		// 12月給与（最新）
		expect(screen.getByText("2024/12/25")).toBeInTheDocument();
		expect(screen.getByText("￥300,000")).toBeInTheDocument();
		expect(screen.getByText("給与")).toBeInTheDocument();
		expect(screen.getByText("12月給与")).toBeInTheDocument();

		// ボーナス
		expect(screen.getByText("2024/12/10")).toBeInTheDocument();
		expect(screen.getByText("￥50,000")).toBeInTheDocument();
		expect(screen.getByText("ボーナス")).toBeInTheDocument();
		expect(screen.getByText("ボーナス支給")).toBeInTheDocument();

		// 副業収入
		expect(screen.getByText("2024/12/01")).toBeInTheDocument();
		expect(screen.getByText("￥10,000")).toBeInTheDocument();
		expect(screen.getByText("副業")).toBeInTheDocument();
		expect(screen.getByText("副業収入")).toBeInTheDocument();
	});

	it("収入金額を緑色で表示する", () => {
		render(<IncomeList transactions={mockIncomeTransactions} />);

		// すべての金額が緑色であることを確認
		const amountElements = screen.getAllByText(/￥\d{1,3}(,\d{3})*/);
		amountElements.forEach((element) => {
			expect(element).toHaveClass("text-green-600");
		});
	});

	it("空の状態を正しく表示する", () => {
		render(<IncomeList transactions={[]} />);

		expect(
			screen.getByText("登録されている収入がありません"),
		).toBeInTheDocument();
		expect(
			screen.getByText("新規登録ボタンから追加してください"),
		).toBeInTheDocument();
		// 収入を表す絵文字
		expect(screen.getByText("💵")).toBeInTheDocument();
	});

	it("ローディング状態を表示する", () => {
		render(<IncomeList transactions={[]} isLoading={true} />);

		// LoadingStateコンポーネントが表示されることを確認
		expect(screen.getByTestId("loading-state")).toBeInTheDocument();
	});

	it("エラー状態を表示する", () => {
		const errorMessage = "収入データの取得に失敗しました";
		render(<IncomeList transactions={[]} error={errorMessage} />);

		expect(screen.getByText(`エラー: ${errorMessage}`)).toBeInTheDocument();
		expect(screen.getByText("⚠️")).toBeInTheDocument();
	});

	it("編集ボタンがクリックされたときにコールバックを呼ぶ", () => {
		const mockOnEdit = vi.fn();
		render(
			<IncomeList transactions={mockIncomeTransactions} onEdit={mockOnEdit} />,
		);

		// 最初の編集ボタンをクリック
		const editButtons = screen.getAllByText("編集");
		fireEvent.click(editButtons[0]);

		// 正しい収入データでコールバックが呼ばれることを確認
		expect(mockOnEdit).toHaveBeenCalledWith(mockIncomeTransactions[0]);
	});

	it("削除ボタンがクリックされたときにコールバックを呼ぶ", () => {
		const mockOnDelete = vi.fn();
		render(
			<IncomeList
				transactions={mockIncomeTransactions}
				onDelete={mockOnDelete}
			/>,
		);

		// 最初の削除ボタンをクリック
		const deleteButtons = screen.getAllByText("削除");
		fireEvent.click(deleteButtons[0]);

		// 正しいIDでコールバックが呼ばれることを確認
		expect(mockOnDelete).toHaveBeenCalledWith("1");
	});

	it("編集・削除ボタンが表示されない場合", () => {
		render(<IncomeList transactions={mockIncomeTransactions} />);

		// onEdit, onDeleteが指定されていない場合、ボタンが表示されない
		expect(screen.queryByText("編集")).not.toBeInTheDocument();
		expect(screen.queryByText("削除")).not.toBeInTheDocument();
	});

	it("説明がない収入データも正しく表示する", () => {
		const transactionsWithoutDescription: Transaction[] = [
			{
				...mockIncomeTransactions[0],
				description: null,
			},
		];

		render(<IncomeList transactions={transactionsWithoutDescription} />);

		// 説明欄が空でもエラーにならないことを確認
		const rows = screen.getAllByRole("row");
		expect(rows).toHaveLength(2); // ヘッダー + 1データ行
	});

	it("レスポンシブデザインが適用されている", () => {
		render(<IncomeList transactions={mockIncomeTransactions} />);

		// モバイル用の省略表記があることを確認
		const categoryHeaders = screen.getAllByText("カテ");
		expect(categoryHeaders.length).toBeGreaterThan(0);
	});
});
