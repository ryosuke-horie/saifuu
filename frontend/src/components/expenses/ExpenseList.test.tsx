/**
 * ExpenseListコンポーネントのテスト
 *
 * テスト内容:
 * - データ処理ロジック（ソート、null値処理）
 * - 編集・削除コールバック処理
 * - パフォーマンス（大量データ処理）
 * - アクセシビリティ要素
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpenseList } from "./ExpenseList";

// モックデータの定義 - TransactionWithCategoryとして使用
const mockTransactions: any[] = [
	// any型で定義し、ExpenseListに渡す際にTransactionWithCategoryとして扱う
	{
		id: "t1",
		amount: 1000,
		type: "expense",
		category: {
			id: "1",
			name: "食費",
			type: "expense",
			color: null,
			description: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		categoryId: "1",
		description: "コーヒー",
		date: "2025-07-09",
		createdAt: "2025-07-09T10:00:00Z",
		updatedAt: "2025-07-09T10:00:00Z",
	},
	{
		id: "t2",
		amount: 2500,
		type: "expense",
		category: {
			id: "2",
			name: "交通費",
			type: "expense",
			color: null,
			description: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		categoryId: "2",
		description: "電車代",
		date: "2025-07-08",
		createdAt: "2025-07-08T09:00:00Z",
		updatedAt: "2025-07-08T09:00:00Z",
	},
	{
		id: "t3",
		amount: 15000,
		type: "expense",
		category: {
			id: "3",
			name: "光熱費",
			type: "expense",
			color: null,
			description: null,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		categoryId: "3",
		description: "電気代",
		date: "2025-07-01",
		createdAt: "2025-07-01T10:00:00Z",
		updatedAt: "2025-07-01T10:00:00Z",
	},
];

describe("ExpenseList", () => {
	describe("インタラクション", () => {
		it("編集ボタンが機能する", () => {
			const mockOnEdit = vi.fn();
			render(
				<ExpenseList
					transactions={mockTransactions}
					isLoading={false}
					error={undefined}
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
					error={undefined}
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
					error={undefined}
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
					error={undefined}
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
					error={undefined}
				/>,
			);

			// 両方の取引が表示されていることを確認
			expect(screen.getByText("取引1")).toBeInTheDocument();
			expect(screen.getByText("取引2")).toBeInTheDocument();
		});
	});

	describe("モバイル表示", () => {
		it("モバイル画面幅でもカテゴリと備考が表示される", () => {
			// ウィンドウ幅をモバイルサイズに設定
			global.innerWidth = 375;
			global.dispatchEvent(new Event("resize"));

			render(
				<ExpenseList
					transactions={mockTransactions}
					isLoading={false}
					error={undefined}
				/>,
			);

			// カテゴリと説明が表示されていることを確認（Issue #325の要件）
			expect(screen.getByText("カテゴリ")).toBeVisible();
			expect(screen.getByText("説明")).toBeVisible();
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
					error={undefined}
				/>,
			);

			// nullの説明は空文字列として表示
			const rows = screen.getAllByRole("row");
			// 日付、金額、カテゴリが含まれることを確認
			expect(rows[1]).toHaveTextContent("2025/07/09");
			expect(rows[1]).toHaveTextContent("-￥1,000"); // 支出なのでマイナス

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
						error={undefined}
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
					error={undefined}
				/>,
			);

			// 長い説明文も表示されることを確認
			expect(screen.getByText("a".repeat(200))).toBeInTheDocument();
		});
	});

	describe.skip("SSR互換性", () => {
		it("初回レンダリング時は仮想スクロールが無効になる", () => {
			// 100件のテストデータ（仮想スクロール閾値を超える）
			const largeDataset = Array.from({ length: 100 }, (_, index) => ({
				...mockTransactions[0],
				id: `ssr-${index}`,
				description: `SSR取引 ${index + 1}`,
			}));

			const { container } = render(
				<ExpenseList
					transactions={largeDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// 初回レンダリング時は仮想スクロールコンテナが存在しない
			const virtualScrollContainer = container.querySelector(
				".virtual-scroll-container",
			);
			expect(virtualScrollContainer).not.toBeInTheDocument();

			// 通常のテーブルが表示されている
			const table = container.querySelector("table");
			expect(table).toBeInTheDocument();
		});

		it("クライアントサイドでの再ハイドレーション後に仮想スクロールが有効になる", async () => {
			// 100件のテストデータ（仮想スクロール閾値を超える）
			const largeDataset = Array.from({ length: 100 }, (_, index) => ({
				...mockTransactions[0],
				id: `hydration-${index}`,
				description: `ハイドレーション取引 ${index + 1}`,
			}));

			const { container } = render(
				<ExpenseList
					transactions={largeDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// 初回レンダリング時は仮想スクロールが無効
			let virtualScrollContainer = container.querySelector(
				".virtual-scroll-container",
			);
			expect(virtualScrollContainer).not.toBeInTheDocument();

			// 仮想スクロールが有効になるまで待つ
			await waitFor(
				() => {
					virtualScrollContainer = container.querySelector(
						".virtual-scroll-container",
					);
					expect(virtualScrollContainer).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		it("少量データでは仮想スクロールが有効にならない", async () => {
			// 50件のテストデータ（仮想スクロール閾値未満）
			const smallDataset = Array.from({ length: 50 }, (_, index) => ({
				...mockTransactions[0],
				id: `small-${index}`,
				description: `少量取引 ${index + 1}`,
			}));

			const { container } = render(
				<ExpenseList
					transactions={smallDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// useEffectの実行を待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 仮想スクロールコンテナが存在しないことを確認
			const virtualScrollContainer = container.querySelector(
				".virtual-scroll-container",
			);
			expect(virtualScrollContainer).not.toBeInTheDocument();

			// 通常のテーブルが表示されている
			const table = container.querySelector("table tbody");
			expect(table).toBeInTheDocument();
			expect(table?.children.length).toBe(50);
		});
	});

	describe.skip("仮想スクロール対応", () => {
		it.skipIf(process.env.CI === "true")(
			"大量データ（1000件以上）でも高速にレンダリングされる",
			() => {
				// 1000件のテストデータを生成
				const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
					...mockTransactions[0],
					id: `large-${index}`,
					description: `取引 ${index + 1}`,
					date: new Date(2025, 6, 15 - (index % 30))
						.toISOString()
						.split("T")[0],
				}));

				const startTime = performance.now();
				render(
					<ExpenseList
						transactions={largeDataset}
						isLoading={false}
						error={undefined}
					/>,
				);
				const renderTime = performance.now() - startTime;

				// CI環境を考慮して閾値を調整
				// CI環境（GitHub Actions）ではより緩い閾値を使用
				// 動的インポートの影響で初回レンダリングは遅くなる可能性がある
				const isCI = process.env.CI === "true";
				const threshold = isCI ? 500 : 400;

				// 仮想スクロール実装後は閾値以内にレンダリングされることを期待
				expect(renderTime).toBeLessThan(threshold);
			},
		);

		it("スクロール時に表示範囲のアイテムのみがDOMに存在する", () => {
			// 1000件のテストデータを生成
			const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
				...mockTransactions[0],
				id: `scroll-${index}`,
				description: `スクロール取引 ${index + 1}`,
				date: new Date(2025, 6, 15).toISOString().split("T")[0],
			}));

			const { container } = render(
				<ExpenseList
					transactions={largeDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// 仮想スクロール実装後は、表示領域に収まる数（約20-30件）のみDOMに存在
			const rows = container.querySelectorAll("tbody tr");
			expect(rows.length).toBeLessThan(50);
		});

		it("スクロール位置に応じて適切なアイテムが表示される", async () => {
			// 1000件のテストデータを生成
			const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
				...mockTransactions[0],
				id: `position-${index}`,
				description: `位置確認取引 ${index + 1}`,
				date: new Date(2025, 6, 15).toISOString().split("T")[0],
			}));

			const { container } = render(
				<ExpenseList
					transactions={largeDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// スクロールコンテナを取得
			const scrollContainer = container.querySelector(
				".virtual-scroll-container",
			);
			expect(scrollContainer).toBeInTheDocument();

			// 初期状態の確認（最初の10件が表示されている）
			expect(screen.getByText("位置確認取引 1")).toBeInTheDocument();
			expect(screen.getByText("位置確認取引 2")).toBeInTheDocument();

			// 仮想スクロールコンテナが適切に設定されていることを確認
			const virtualContainer = container.querySelector(
				'[style*="height: 59400px"]',
			); // 1000 * 60 - 600
			expect(virtualContainer).toBeInTheDocument();

			// 注: テスト環境では仮想スクロールのスクロールイベントハンドリングに制限があるため、
			// 実際のスクロール動作のテストは統合テストまたはE2Eテストで行うことを推奨
		});

		it("仮想スクロール有効時もソート機能が正常に動作する", () => {
			// 異なる日付の大量データを生成
			const unsortedLargeDataset = Array.from({ length: 100 }, (_, index) => ({
				...mockTransactions[0],
				id: `sort-${index}`,
				description: `ソート取引 ${index + 1}`,
				// ランダムな日付を生成
				date: new Date(2025, 6, Math.floor(Math.random() * 30) + 1)
					.toISOString()
					.split("T")[0],
			}));

			render(
				<ExpenseList
					transactions={unsortedLargeDataset}
					isLoading={false}
					error={undefined}
				/>,
			);

			// 最初のアイテムが最新日付であることを確認
			const firstRow = screen.getAllByRole("row")[1];
			const firstDate = firstRow.querySelector("td")?.textContent;

			// 2番目のアイテムの日付を取得
			const secondRow = screen.getAllByRole("row")[2];
			const secondDate = secondRow.querySelector("td")?.textContent;

			// 日付降順でソートされていることを確認
			expect(new Date(firstDate!).getTime()).toBeGreaterThanOrEqual(
				new Date(secondDate!).getTime(),
			);
		});

		it("仮想スクロール有効時も編集・削除機能が正常に動作する", () => {
			const mockOnEdit = vi.fn();
			const mockOnDelete = vi.fn();

			// 100件のテストデータを生成
			const dataset = Array.from({ length: 100 }, (_, index) => ({
				...mockTransactions[0],
				id: `action-${index}`,
				description: `アクション取引 ${index + 1}`,
				date: new Date(2025, 6, 15).toISOString().split("T")[0],
			}));

			render(
				<ExpenseList
					transactions={dataset}
					isLoading={false}
					error={undefined}
					onEdit={mockOnEdit}
					onDelete={mockOnDelete}
				/>,
			);

			// 最初の編集ボタンをクリック
			const editButtons = screen.getAllByText("編集");
			fireEvent.click(editButtons[0]);

			// 正しいデータで編集コールバックが呼ばれることを確認
			expect(mockOnEdit).toHaveBeenCalledWith(
				expect.objectContaining({
					id: expect.stringMatching(/^action-\d+$/),
				}),
			);
		});
	});
});
