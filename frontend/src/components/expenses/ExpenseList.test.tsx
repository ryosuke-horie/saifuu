/**
 * ExpenseListコンポーネントのテスト
 *
 * テスト内容:
 * - データ処理ロジック（ソート、null値処理）
 * - 編集・削除コールバック処理
 * - パフォーマンス（大量データ処理）
 * - アクセシビリティ要素
 * 
 * 注: UI表示・レスポンシブデザインテストはStorybookに移行
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockTransactions } from "../../../.storybook/mocks/data/transactions";
import { ExpenseList } from "./ExpenseList";

describe("ExpenseList", () => {


	describe("インタラクション", () => {
		it("編集ボタンが機能する", () => {
			const mockOnEdit = vi.fn();
			render(
				<ExpenseList
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					onEdit={mockOnEdit}
				/>,
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
				/>,
			);

			const deleteButtons = screen.getAllByText("削除");
			fireEvent.click(deleteButtons[0]);

			expect(mockOnDelete).toHaveBeenCalledWith(mockTransactions[0].id);
		});

	});

	describe("アクセシビリティ", () => {
		it("適切なARIA属性が設定されている", () => {
			const mockOnEdit = vi.fn();
			const mockOnDelete = vi.fn();

			render(
				<ExpenseList
					transactions={mockTransactions}
					isLoading={false}
					error={null}
					onEdit={mockOnEdit}
					onDelete={mockOnDelete}
				/>,
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


	describe("ソート機能", () => {
		it("取引が日付降順でソートされる", () => {
			// 異なる日付の取引データを作成
			const unsortedTransactions = [
				{
					...mockTransactions[0],
					id: "t1",
					date: "2025-07-01",
					description: "1日",
				},
				{
					...mockTransactions[0],
					id: "t2",
					date: "2025-07-15",
					description: "15日",
				},
				{
					...mockTransactions[0],
					id: "t3",
					date: "2025-07-08",
					description: "8日",
				},
			];

			render(
				<ExpenseList
					transactions={unsortedTransactions}
					isLoading={false}
					error={null}
				/>,
			);

			// 日付降順で表示されていることを確認
			const rows = screen.getAllByRole("row");
			// ヘッダー行を除いた最初の行が15日のデータ
			expect(rows[1]).toHaveTextContent("15日");
			// 2番目が8日のデータ
			expect(rows[2]).toHaveTextContent("8日");
			// 3番目が1日のデータ
			expect(rows[3]).toHaveTextContent("1日");
		});

		it("同じ日付の取引も正しく表示される", () => {
			const sameDateTransactions = [
				{
					...mockTransactions[0],
					id: "t1",
					date: "2025-07-15",
					description: "取引1",
				},
				{
					...mockTransactions[0],
					id: "t2",
					date: "2025-07-15",
					description: "取引2",
				},
			];

			render(
				<ExpenseList
					transactions={sameDateTransactions}
					isLoading={false}
					error={null}
				/>,
			);

			// 両方の取引が表示されていることを確認
			expect(screen.getByText("取引1")).toBeInTheDocument();
			expect(screen.getByText("取引2")).toBeInTheDocument();
		});
	});

	describe("大量データの処理", () => {
		it("100件の取引データでも正常にレンダリングされる", () => {
			// 100件のデータを生成
			const manyTransactions = Array.from({ length: 100 }, (_, i) => ({
				...mockTransactions[0],
				id: `t${i}`,
				date: `2025-07-${String((i % 30) + 1).padStart(2, "0")}`,
				description: `取引${i + 1}`,
			}));

			const { container } = render(
				<ExpenseList
					transactions={manyTransactions}
					isLoading={false}
					error={null}
				/>,
			);

			// テーブルがレンダリングされていることを確認
			const table = screen.getByRole("table");
			expect(table).toBeInTheDocument();

			// 行数を確認（ヘッダー + 100件のデータ）
			const rows = container.querySelectorAll("tbody tr");
			expect(rows).toHaveLength(100);
		});

		it("取引データのコピーが作成されてソートされる", () => {
			// 元のデータを保持
			const originalTransactions = [...mockTransactions];

			render(
				<ExpenseList
					transactions={mockTransactions}
					isLoading={false}
					error={null}
				/>,
			);

			// 元のデータが変更されていないことを確認
			expect(mockTransactions).toEqual(originalTransactions);
		});
	});


	describe("エッジケース", () => {

		it("取引データのnull値でも安全に処理される", () => {
			const transactionWithNulls = [
				{
					...mockTransactions[0],
					description: null,
					category: null,
				},
			];

			render(
				<ExpenseList
					transactions={transactionWithNulls}
					isLoading={false}
					error={null}
				/>,
			);

			// nullの説明は空文字列として表示
			const rows = screen.getAllByRole("row");
			// 日付、金額、カテゴリが含まれることを確認
			expect(rows[1]).toHaveTextContent("2025/07/09");
			expect(rows[1]).toHaveTextContent("-\uffe51,000"); // 支出なのでマイナス

			// nullのカテゴリは"未分類"として表示
			expect(screen.getByText("未分類")).toBeInTheDocument();
		});

		it("無効な日付データでもクラッシュしない", () => {
			const invalidDateTransaction = [
				{
					...mockTransactions[0],
					date: "invalid-date",
				},
			];

			expect(() => {
				render(
					<ExpenseList
						transactions={invalidDateTransaction}
						isLoading={false}
						error={null}
					/>,
				);
			}).not.toThrow();
		});

		it("非常に長い説明文でも適切に表示される", () => {
			const longDescriptionTransaction = [
				{
					...mockTransactions[0],
					description: "a".repeat(200),
				},
			];

			render(
				<ExpenseList
					transactions={longDescriptionTransaction}
					isLoading={false}
					error={null}
				/>,
			);

			// 長い説明文も表示されることを確認
			expect(screen.getByText("a".repeat(200))).toBeInTheDocument();
		});
	});
});
