import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { Category } from "../../lib/api/types";
import { SubscriptionList } from "./SubscriptionList";

// モックデータの定義 - SubscriptionWithCategoryとして使用
const mockCategories: Category[] = [
	{
		id: "1",
		name: "交通費",
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		name: "光熱費",
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "3",
		name: "食費",
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "4",
		name: "その他",
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "5",
		name: "仕事・ビジネス",
		type: "expense",
		color: null,
		description: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

const mockSubscriptions: any[] = [
	// any型で定義し、SubscriptionListに渡す際にSubscriptionWithCategoryとして扱う
	{
		id: "sub1",
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly",
		nextBillingDate: "2025-07-01",
		category: mockCategories[3],
		categoryId: mockCategories[3].id,
		startDate: "2024-01-01",
		endDate: null,
		isActive: true,
		description: "動画配信サービス",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "sub2",
		name: "Spotify",
		amount: 980,
		billingCycle: "monthly",
		nextBillingDate: "2025-07-15",
		category: mockCategories[3],
		categoryId: mockCategories[3].id,
		startDate: "2024-02-01",
		endDate: null,
		isActive: true,
		description: "音楽配信サービス",
		createdAt: "2024-02-01T00:00:00Z",
		updatedAt: "2024-02-01T00:00:00Z",
	},
	{
		id: "sub3",
		name: "Adobe Creative Suite",
		amount: 5680,
		billingCycle: "monthly",
		nextBillingDate: "2025-07-20",
		category: mockCategories[4],
		categoryId: mockCategories[4].id,
		startDate: "2024-03-01",
		endDate: null,
		isActive: true,
		description: "デザインツール",
		createdAt: "2024-03-01T00:00:00Z",
		updatedAt: "2024-03-01T00:00:00Z",
	},
];

/**
 * SubscriptionListコンポーネントのテスト
 *
 * テスト内容:
 * - 基本的なレンダリング
 * - データの正しい表示
 * - ローディング状態
 * - エラー状態
 * - 空状態
 * - レスポンシブ表示
 * - アクセシビリティ
 */

describe("SubscriptionList", () => {
	const defaultProps = {
		subscriptions: mockSubscriptions,
		isLoading: false,
		error: null,
	};

	describe("基本的なレンダリング", () => {
		it("正常にレンダリングされること", () => {
			render(<SubscriptionList {...defaultProps} />);

			expect(screen.getByText("サブスクリプション一覧")).toBeInTheDocument();
			expect(
				screen.getByText("現在登録されているサブスクリプションサービス"),
			).toBeInTheDocument();
		});

		it("テーブルヘッダーが正しく表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			expect(screen.getByText("サービス名")).toBeInTheDocument();
			expect(screen.getByText("料金")).toBeInTheDocument();
			expect(screen.getByText("請求サイクル")).toBeInTheDocument();
			expect(screen.getByText("カテゴリ")).toBeInTheDocument();
			expect(screen.getByText("次回請求日")).toBeInTheDocument();
		});

		it("カスタムクラス名が適用されること", () => {
			const { container } = render(
				<SubscriptionList {...defaultProps} className="custom-class" />,
			);

			expect(container.firstChild).toHaveClass("custom-class");
		});
	});

	describe("データ表示", () => {
		it("サブスクリプションデータが正しく表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// モックデータの各項目が表示されていることを確認
			expect(screen.getByText("Netflix")).toBeInTheDocument();
			expect(screen.getByText("Spotify")).toBeInTheDocument();
			expect(screen.getByText("Adobe Creative Suite")).toBeInTheDocument();
		});

		it("料金が正しい形式で表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// 日本円形式での表示を確認
			expect(screen.getByText("￥1,480")).toBeInTheDocument();
			expect(screen.getByText("￥980")).toBeInTheDocument();
			expect(screen.getByText("￥5,680")).toBeInTheDocument();
		});

		it("請求サイクルが日本語で表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// 月額表示の確認
			const monthlyTexts = screen.getAllByText("月額");
			expect(monthlyTexts.length).toBeGreaterThan(0);
		});

		it("カテゴリが日本語で表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			expect(screen.getAllByText("その他").length).toBeGreaterThan(0);
			expect(screen.getByText("仕事・ビジネス")).toBeInTheDocument();
		});

		it("次回請求日が正しい形式で表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// 日付形式の確認（YYYY/MM/DD形式）
			expect(screen.getByText("2025/07/01")).toBeInTheDocument();
		});
	});

	describe("ローディング状態", () => {
		it("ローディング状態が正しく表示されること", () => {
			render(
				<SubscriptionList subscriptions={[]} isLoading={true} error={null} />,
			);

			expect(screen.getByText("読み込み中...")).toBeInTheDocument();

			// ローディングスピナーの存在確認
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeInTheDocument();
		});
	});

	describe("エラー状態", () => {
		it("エラー状態が正しく表示されること", () => {
			const errorMessage = "データの取得に失敗しました";
			render(
				<SubscriptionList
					subscriptions={[]}
					isLoading={false}
					error={errorMessage}
				/>,
			);

			expect(screen.getByText(`エラー: ${errorMessage}`)).toBeInTheDocument();
			expect(screen.getByText("⚠️")).toBeInTheDocument();
		});
	});

	describe("空状態", () => {
		it("空状態が正しく表示されること", () => {
			render(
				<SubscriptionList subscriptions={[]} isLoading={false} error={null} />,
			);

			expect(
				screen.getByText("登録されているサブスクリプションがありません"),
			).toBeInTheDocument();
			expect(
				screen.getByText("新規登録ボタンから追加してください"),
			).toBeInTheDocument();
			expect(screen.getByText("📋")).toBeInTheDocument();
		});
	});

	describe("レスポンシブ表示", () => {
		it("隠されるカラムに適切なクラスが適用されていること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// 請求サイクル列（sm以下で非表示）
			const billingCycleHeader = screen.getByText("請求サイクル");
			expect(billingCycleHeader.closest("th")).toHaveClass(
				"hidden",
				"sm:table-cell",
			);

			// カテゴリ列（md以下で非表示）
			const categoryHeader = screen.getByText("カテゴリ");
			expect(categoryHeader.closest("th")).toHaveClass(
				"hidden",
				"md:table-cell",
			);
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なテーブル構造が実装されていること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// テーブル要素の存在確認
			expect(screen.getByRole("table")).toBeInTheDocument();

			// ヘッダーセルの確認
			const headers = screen.getAllByRole("columnheader");
			expect(headers.length).toBeGreaterThan(0);

			// データセルの確認
			const cells = screen.getAllByRole("cell");
			expect(cells.length).toBeGreaterThan(0);
		});

		it("ヘッダーにscope属性が設定されていること", () => {
			render(<SubscriptionList {...defaultProps} />);

			const serviceNameHeader = screen.getByText("サービス名");
			expect(serviceNameHeader.closest("th")).toHaveAttribute("scope", "col");
		});
	});

	describe("データ処理", () => {
		it("単一アイテムが正しく表示されること", () => {
			const singleSubscription: any[] = [mockSubscriptions[0]];
			render(
				<SubscriptionList
					subscriptions={singleSubscription}
					isLoading={false}
					error={null}
				/>,
			);

			expect(screen.getByText("Netflix")).toBeInTheDocument();
			expect(screen.queryByText("Spotify")).not.toBeInTheDocument();
		});

		it("複数アイテムが正しく表示されること", () => {
			render(<SubscriptionList {...defaultProps} />);

			// 各サブスクリプションの表示確認
			mockSubscriptions.forEach((subscription) => {
				expect(screen.getByText(subscription.name)).toBeInTheDocument();
			});
		});
	});

	describe("削除ボタンの機能", () => {
		it("削除ボタンが正しく表示されること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// 操作列のヘッダーが表示されること
			expect(screen.getByText("操作")).toBeInTheDocument();

			// 各行に削除ボタンが表示されること
			const deleteButtons = screen.getAllByRole("button");
			expect(deleteButtons).toHaveLength(mockSubscriptions.length);

			// ボタンに適切なタイトル属性が設定されていること
			mockSubscriptions.forEach((subscription) => {
				const button = screen.getByTitle(`${subscription.name}を削除`);
				expect(button).toBeInTheDocument();
			});
		});

		it("削除ボタンをクリックするとonDeleteが正しい引数で呼ばれること", async () => {
			const user = userEvent.setup();
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// 最初のサブスクリプションの削除ボタンをクリック
			const firstDeleteButton = screen.getByTitle(
				`${mockSubscriptions[0].name}を削除`,
			);
			await user.click(firstDeleteButton);

			expect(onDeleteMock).toHaveBeenCalledTimes(1);
			expect(onDeleteMock).toHaveBeenCalledWith(
				mockSubscriptions[0].id,
				mockSubscriptions[0].name,
			);
		});

		it("複数のサブスクリプションの削除ボタンが独立して動作すること", async () => {
			const user = userEvent.setup();
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// 2つ目のサブスクリプションの削除ボタンをクリック
			const secondDeleteButton = screen.getByTitle(
				`${mockSubscriptions[1].name}を削除`,
			);
			await user.click(secondDeleteButton);

			expect(onDeleteMock).toHaveBeenCalledTimes(1);
			expect(onDeleteMock).toHaveBeenCalledWith(
				mockSubscriptions[1].id,
				mockSubscriptions[1].name,
			);

			// 3つ目のサブスクリプションの削除ボタンをクリック
			const thirdDeleteButton = screen.getByTitle(
				`${mockSubscriptions[2].name}を削除`,
			);
			await user.click(thirdDeleteButton);

			expect(onDeleteMock).toHaveBeenCalledTimes(2);
			expect(onDeleteMock).toHaveBeenNthCalledWith(
				2,
				mockSubscriptions[2].id,
				mockSubscriptions[2].name,
			);
		});

		it("onDeleteが提供されない場合、削除ボタンがdisabledになること", () => {
			render(<SubscriptionList {...defaultProps} onDelete={undefined} />);

			const deleteButtons = screen.getAllByRole("button");
			deleteButtons.forEach((button) => {
				expect(button).toBeDisabled();
			});
		});

		it("onDeleteがnullの場合、削除ボタンがdisabledになること", () => {
			render(<SubscriptionList {...defaultProps} onDelete={null as any} />);

			const deleteButtons = screen.getAllByRole("button");
			deleteButtons.forEach((button) => {
				expect(button).toBeDisabled();
			});
		});

		it("削除ボタンにアクセシビリティ属性が適切に設定されていること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			mockSubscriptions.forEach((subscription) => {
				const button = screen.getByTitle(`${subscription.name}を削除`);

				// button要素であることを確認
				expect(button.tagName.toLowerCase()).toBe("button");

				// type属性が設定されていることを確認
				expect(button).toHaveAttribute("type", "button");

				// title属性が設定されていることを確認
				expect(button).toHaveAttribute("title", `${subscription.name}を削除`);
			});
		});

		it("削除ボタンに適切なスタイルが適用されていること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			const firstDeleteButton = screen.getByTitle(
				`${mockSubscriptions[0].name}を削除`,
			);

			// 削除ボタンに危険なアクションを示すスタイルが適用されていること
			expect(firstDeleteButton).toHaveClass(
				"text-red-600",
				"hover:text-red-700",
				"hover:bg-red-50",
			);

			// その他のスタイルクラスが適用されていること
			expect(firstDeleteButton).toHaveClass(
				"p-2",
				"rounded",
				"transition-colors",
			);
		});

		it("削除ボタンのアイコンが正しく表示されること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// TrashIconが表示されていることを確認
			// SVGアイコンの存在を間接的に確認
			const deleteButtons = screen.getAllByRole("button");
			expect(deleteButtons[0]).toContainHTML("svg");
		});

		it("キーボード操作で削除ボタンにアクセスできること", async () => {
			const user = userEvent.setup();
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// タブキーでボタンにフォーカスを移動
			await user.tab();
			const firstDeleteButton = screen.getByTitle(
				`${mockSubscriptions[0].name}を削除`,
			);
			expect(firstDeleteButton).toHaveFocus();

			// Enterキーで削除を実行
			await user.keyboard("{Enter}");
			expect(onDeleteMock).toHaveBeenCalledWith(
				mockSubscriptions[0].id,
				mockSubscriptions[0].name,
			);
		});

		it("削除ボタンが中央揃えで表示されること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			// 削除ボタンのコンテナが中央揃えのスタイルを持つこと
			const buttonContainers = document.querySelectorAll("td:last-child .flex");
			expect(buttonContainers).toHaveLength(mockSubscriptions.length);

			buttonContainers.forEach((container) => {
				expect(container).toHaveClass("justify-center");
			});
		});

		it("操作列のヘッダーが中央揃えで表示されること", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			const operationHeader = screen.getByText("操作").closest("th");
			expect(operationHeader).toHaveClass("text-center");
		});

		it("削除ボタンがホバー効果を持つこと", () => {
			const onDeleteMock = vi.fn();
			render(<SubscriptionList {...defaultProps} onDelete={onDeleteMock} />);

			const firstDeleteButton = screen.getByTitle(
				`${mockSubscriptions[0].name}を削除`,
			);

			// ホバー時のスタイルクラスが含まれていること
			expect(firstDeleteButton.className).toContain("hover:text-red-700");
			expect(firstDeleteButton.className).toContain("hover:bg-red-50");
		});

		it("disabled状態の削除ボタンではonDeleteが呼ばれないこと", async () => {
			const user = userEvent.setup();
			const onDeleteMock = vi.fn();

			// onDeleteを undefined に設定してdisabled状態にする
			render(<SubscriptionList {...defaultProps} onDelete={undefined} />);

			const firstDeleteButton = screen.getByTitle(
				`${mockSubscriptions[0].name}を削除`,
			);
			expect(firstDeleteButton).toBeDisabled();

			// クリックしてもonDeleteが呼ばれないことを確認
			await user.click(firstDeleteButton);
			expect(onDeleteMock).not.toHaveBeenCalled();
		});

		it("空のサブスクリプション配列では削除ボタンが表示されないこと", () => {
			const onDeleteMock = vi.fn();
			render(
				<SubscriptionList
					subscriptions={[]}
					isLoading={false}
					error={null}
					onDelete={onDeleteMock}
				/>,
			);

			// 削除ボタンが存在しないことを確認
			const deleteButtons = screen.queryAllByRole("button");
			expect(deleteButtons).toHaveLength(0);
		});

		it("ローディング中は削除ボタンが表示されないこと", () => {
			const onDeleteMock = vi.fn();
			render(
				<SubscriptionList
					subscriptions={mockSubscriptions}
					isLoading={true}
					error={null}
					onDelete={onDeleteMock}
				/>,
			);

			// ローディング中は削除ボタンが表示されない
			const deleteButtons = screen.queryAllByRole("button");
			expect(deleteButtons).toHaveLength(0);
		});

		it("エラー状態では削除ボタンが表示されないこと", () => {
			const onDeleteMock = vi.fn();
			render(
				<SubscriptionList
					subscriptions={mockSubscriptions}
					isLoading={false}
					error="エラーが発生しました"
					onDelete={onDeleteMock}
				/>,
			);

			// エラー状態では削除ボタンが表示されない
			const deleteButtons = screen.queryAllByRole("button");
			expect(deleteButtons).toHaveLength(0);
		});
	});
});
