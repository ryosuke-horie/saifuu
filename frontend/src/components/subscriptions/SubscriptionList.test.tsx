import { render, screen } from "@testing-library/react";
import type { Category, Subscription } from "../../lib/api/types";
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

const mockSubscriptions: any[] = [  // any型で定義し、SubscriptionListに渡す際にSubscriptionWithCategoryとして扱う
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
});
