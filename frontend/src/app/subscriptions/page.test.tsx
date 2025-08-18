import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import type { Category, Subscription } from "../../lib/api/types";
import SubscriptionsPage from "./page";

// モックデータの定義
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

// SubscriptionWithCategoryではなく、基本のSubscription型として定義
const mockSubscriptions: Subscription[] = [
	{
		id: "sub1",
		name: "Netflix",
		amount: 1480,
		billingCycle: "monthly",
		nextBillingDate: "2025-07-01",
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
 * SubscriptionsPageコンポーネントのテスト
 *
 * テスト内容:
 * - 基本的なレンダリング
 * - 統計情報の計算ロジック
 * - コンポーネント統合テスト
 * - データ処理テスト
 * - エラーハンドリング
 * - ユーザーインタラクション
 */

// モックの設定
vi.mock("../../lib/api/hooks/useSubscriptions", () => ({
	useSubscriptions: vi.fn(),
	useCreateSubscription: vi.fn(),
}));

vi.mock("../../components/subscriptions", () => ({
	NewSubscriptionButton: vi.fn(({ onClick }) => (
		<button type="button" onClick={onClick}>
			新規登録
		</button>
	)),
	NewSubscriptionDialog: vi.fn(({ isOpen, onClose, onSubmit }) => {
		if (!isOpen) return null;
		return (
			<div data-testid="new-subscription-dialog">
				<button type="button" onClick={onClose}>
					閉じる
				</button>
				<button type="button" onClick={() => onSubmit({} as any)}>
					送信
				</button>
			</div>
		);
	}),
	SubscriptionList: vi.fn(({ subscriptions, isLoading, error }) => (
		<div data-testid="subscription-list">
			{isLoading && <div>読み込み中...</div>}
			{error && <div>エラー: {error}</div>}
			{subscriptions.map((sub: Subscription) => (
				<div key={sub.id}>{sub.name}</div>
			))}
		</div>
	)),
}));

describe("SubscriptionsPage", () => {
	// デフォルトのモック値（新しいAPIに合わせて更新）
	const defaultSubscriptionsHook = {
		subscriptions: mockSubscriptions,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	};

	beforeEach(async () => {
		// モックをリセット
		vi.clearAllMocks();

		// デフォルトのモック実装を設定
		const { useSubscriptions, useCreateSubscription } = await import(
			"../../lib/api/hooks/useSubscriptions"
		);

		vi.mocked(useSubscriptions).mockReturnValue(defaultSubscriptionsHook);
		vi.mocked(useCreateSubscription).mockReturnValue({
			isLoading: false,
			error: null,
			createSubscription: vi.fn(),
		});
	});

	describe("基本的なレンダリング", () => {
		it("ページタイトルが正しく表示されること", async () => {
			render(<SubscriptionsPage />);

			const title = screen.getByRole("heading", {
				level: 1,
				name: "サブスクリプション管理",
			});
			expect(title).toBeInTheDocument();
		});

		it("ページ説明文が正しく表示されること", async () => {
			render(<SubscriptionsPage />);

			expect(
				screen.getByText("定期購読サービスの管理と費用の把握"),
			).toBeInTheDocument();
		});

		it("新規登録ボタンが表示されること", async () => {
			render(<SubscriptionsPage />);

			expect(screen.getByText("新規登録")).toBeInTheDocument();
		});

		it("サブスクリプション一覧コンポーネントが表示されること", async () => {
			render(<SubscriptionsPage />);

			expect(screen.getByTestId("subscription-list")).toBeInTheDocument();
		});

		it("統計情報セクションが表示されること", async () => {
			render(<SubscriptionsPage />);

			// 統計カードのタイトルを確認
			expect(screen.getByText("登録サービス数")).toBeInTheDocument();
			expect(screen.getByText("月間合計")).toBeInTheDocument();
		});
	});

	describe("統計情報の計算ロジック", () => {
		it("登録サービス数が正しく計算されること", async () => {
			render(<SubscriptionsPage />);

			// mockSubscriptionsには3つのサービスがある
			expect(screen.getByText("3 サービス")).toBeInTheDocument();
		});

		it("月間合計金額が正しく計算されること（月額サービス）", async () => {
			render(<SubscriptionsPage />);

			// Netflix(1480) + Spotify(980) + Adobe(5680) = 8140
			expect(screen.getByText("¥8,140")).toBeInTheDocument();
		});

		it("月間合計金額が正しく計算されること（年額サービスの月割り）", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			const yearlySubscriptions = [
				{
					id: "1",
					name: "Yearly Service",
					amount: 12000, // 年額12,000円
					billingCycle: "yearly" as const,
					nextBillingDate: "2025-07-01",
					categoryId: mockCategories[0].id,
					startDate: "2025-01-01",
					endDate: null,
					isActive: true,
					description: null,
					createdAt: "2025-01-01T00:00:00Z",
					updatedAt: "2025-01-01T00:00:00Z",
				},
			];
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				subscriptions: yearlySubscriptions,
			});

			render(<SubscriptionsPage />);

			// 12000 / 12 = 1000円/月
			expect(screen.getByText("¥1,000")).toBeInTheDocument();
		});

		it("非アクティブなサービスが合計金額から除外されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			const subscriptionsWithInactive = [
				...mockSubscriptions,
				{
					id: "4",
					name: "Inactive Service",
					amount: 1000,
					billingCycle: "monthly" as const,
					nextBillingDate: "2025-07-20",
					categoryId: mockCategories[0].id,
					startDate: "2025-01-01",
					endDate: null,
					isActive: false,
					description: null,
					createdAt: "2025-01-01T00:00:00Z",
					updatedAt: "2025-01-01T00:00:00Z",
				},
			];
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				subscriptions: subscriptionsWithInactive,
			});

			render(<SubscriptionsPage />);

			// アクティブなサービスのみの合計が表示されること
			expect(screen.getByText("¥8,140")).toBeInTheDocument();
		});

		it("読み込み中の状態で統計情報が適切に表示されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				isLoading: true,
			});

			render(<SubscriptionsPage />);

			// 統計情報とリストで読み込み中表示
			const loadingTexts = screen.getAllByText("読み込み中...");
			expect(loadingTexts).toHaveLength(3); // 統計2つ + リスト1つ

			// サービス数のローディング表示
			expect(screen.getByText("...")).toBeInTheDocument();
		});
	});

	describe("コンポーネント統合テスト", () => {
		it("新規登録ボタンクリックでダイアログが開くこと", async () => {
			render(<SubscriptionsPage />);

			const newButton = screen.getByText("新規登録");
			fireEvent.click(newButton);

			expect(screen.getByTestId("new-subscription-dialog")).toBeInTheDocument();
		});

		it("ダイアログの閉じるボタンでダイアログが閉じること", async () => {
			render(<SubscriptionsPage />);

			// ダイアログを開く
			const newButton = screen.getByText("新規登録");
			fireEvent.click(newButton);

			// ダイアログを閉じる
			const closeButton = screen.getByText("閉じる");
			fireEvent.click(closeButton);

			expect(
				screen.queryByTestId("new-subscription-dialog"),
			).not.toBeInTheDocument();
		});

		it("新規登録の送信が成功した場合、ダイアログが閉じること", async () => {
			const mockCreateMutation = vi.fn().mockResolvedValue({
				id: "new-1",
				name: "Test Service",
			});
			const { useCreateSubscription } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useCreateSubscription).mockReturnValue({
				isLoading: false,
				error: null,
				createSubscription: mockCreateMutation,
			});

			render(<SubscriptionsPage />);

			// ダイアログを開く
			const newButton = screen.getByText("新規登録");
			fireEvent.click(newButton);

			// 送信ボタンをクリック
			const submitButton = screen.getByText("送信");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(
					screen.queryByTestId("new-subscription-dialog"),
				).not.toBeInTheDocument();
			});

			expect(mockCreateMutation).toHaveBeenCalled();
		});

		it("新規登録の送信でエラーが発生した場合、ダイアログが開いたままになること", async () => {
			const mockCreateMutation = vi
				.fn()
				.mockRejectedValue(new Error("登録エラー"));
			const { useCreateSubscription } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useCreateSubscription).mockReturnValue({
				isLoading: false,
				error: null,
				createSubscription: mockCreateMutation,
			});

			// コンソールエラーを抑制
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			render(<SubscriptionsPage />);

			// ダイアログを開く
			const newButton = screen.getByText("新規登録");
			fireEvent.click(newButton);

			// 送信ボタンをクリック
			const submitButton = screen.getByText("送信");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockCreateMutation).toHaveBeenCalled();
			});

			// エラー時もダイアログが開いたまま
			expect(screen.getByTestId("new-subscription-dialog")).toBeInTheDocument();

			consoleSpy.mockRestore();
		});

		it("サブスクリプションフックがパラメータなしで呼び出されること（グローバルカテゴリ使用）", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);

			render(<SubscriptionsPage />);

			expect(useSubscriptions).toHaveBeenCalledWith();
		});

		it("サブスクリプションフックのローディング状態が正しく伝播されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				isLoading: true,
			});

			const { SubscriptionList } = await import(
				"../../components/subscriptions"
			);
			render(<SubscriptionsPage />);

			// モック呼び出しの引数を確認
			expect(SubscriptionList).toHaveBeenCalled();
			const callArgs = vi.mocked(SubscriptionList).mock.calls[0][0];
			expect(callArgs.isLoading).toBe(true);
		});
	});

	describe("データ処理テスト", () => {
		it("空のサブスクリプションリストが正しく処理されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				subscriptions: [],
			});

			render(<SubscriptionsPage />);

			expect(screen.getByText("0 サービス")).toBeInTheDocument();
			expect(screen.getByText("¥0")).toBeInTheDocument();
		});

		it("単一のサブスクリプションが正しく処理されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			const singleSubscription = [mockSubscriptions[0]];
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				subscriptions: singleSubscription,
			});

			render(<SubscriptionsPage />);

			expect(screen.getByText("1 サービス")).toBeInTheDocument();
			expect(screen.getByText("Netflix")).toBeInTheDocument();
			expect(screen.getByText("¥1,480")).toBeInTheDocument();
		});

		it("複数のサブスクリプションが正しく処理されること", async () => {
			render(<SubscriptionsPage />);

			// 各サブスクリプションが表示されていることを確認
			mockSubscriptions.forEach((subscription) => {
				expect(screen.getByText(subscription.name)).toBeInTheDocument();
			});
		});

		it("サブスクリプションの作成が正しく処理されること", async () => {
			const mockCreateMutation = vi.fn().mockResolvedValue({
				id: "new-1",
				name: "New Service",
			});
			const { useCreateSubscription } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useCreateSubscription).mockReturnValue({
				isLoading: false,
				error: null,
				createSubscription: mockCreateMutation,
			});

			// コンソールログを監視
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			render(<SubscriptionsPage />);

			// ダイアログを開いて送信
			fireEvent.click(screen.getByText("新規登録"));
			fireEvent.click(screen.getByText("送信"));

			await waitFor(() => {
				expect(mockCreateMutation).toHaveBeenCalled();
				expect(consoleSpy).toHaveBeenCalledWith(
					"新しいサブスクリプションを登録しました",
				);
			});

			consoleSpy.mockRestore();
		});
	});

	describe("エラーハンドリング", () => {
		it("サブスクリプション取得エラーが表示されること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "サブスクリプションの取得に失敗しました",
			});

			render(<SubscriptionsPage />);

			expect(
				screen.getByText("データの読み込みに失敗しました"),
			).toBeInTheDocument();
			expect(
				screen.getByText("サブスクリプションの取得に失敗しました"),
			).toBeInTheDocument();
		});

		it("サブスクリプションエラーが発生した場合の表示", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "サブスクリプションエラー",
			});

			render(<SubscriptionsPage />);

			// エラーメッセージと再試行ボタンが表示される
			expect(
				screen.getByText("データの読み込みに失敗しました"),
			).toBeInTheDocument();
			expect(screen.getByText("再試行")).toBeInTheDocument();
		});

		it("エラー時の再試行ボタンが正しく動作すること", async () => {
			const mockRefetchSubscriptions = vi.fn();
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "サブスクリプションエラー",
				refetch: mockRefetchSubscriptions,
			});

			render(<SubscriptionsPage />);

			const retryButton = screen.getByText("再試行");
			fireEvent.click(retryButton);

			expect(mockRefetchSubscriptions).toHaveBeenCalledTimes(1);
		});

		it("サブスクリプション作成エラーがコンソールに出力されること", async () => {
			const mockError = new Error("作成エラー");
			const mockCreateMutation = vi.fn().mockRejectedValue(mockError);
			const { useCreateSubscription } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useCreateSubscription).mockReturnValue({
				isLoading: false,
				error: null,
				createSubscription: mockCreateMutation,
			});

			// コンソールエラーを監視
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			render(<SubscriptionsPage />);

			// ダイアログを開いて送信
			fireEvent.click(screen.getByText("新規登録"));
			fireEvent.click(screen.getByText("送信"));

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"サブスクリプション登録エラー:",
					mockError,
				);
			});

			consoleSpy.mockRestore();
		});
	});

	describe("ユーザーインタラクション", () => {
		it("新規登録ボタンがクリック可能であること", async () => {
			const { NewSubscriptionButton } = await import(
				"../../components/subscriptions"
			);
			render(<SubscriptionsPage />);

			const newButton = screen.getByText("新規登録");
			fireEvent.click(newButton);

			// NewSubscriptionButtonが正しく呼ばれたことを確認
			expect(NewSubscriptionButton).toHaveBeenCalled();
			const callArgs = vi.mocked(NewSubscriptionButton).mock.calls[0][0];
			expect(callArgs.onClick).toBeTypeOf("function");
		});

		it("エラー時の再試行ボタンがクリック可能であること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "エラー",
			});

			render(<SubscriptionsPage />);

			const retryButton = screen.getByText("再試行");
			expect(retryButton).toBeInTheDocument();
			expect(retryButton).not.toBeDisabled();
		});

		it("ダイアログの表示・非表示が正しく切り替わること", async () => {
			render(<SubscriptionsPage />);

			// 初期状態でダイアログは非表示
			expect(
				screen.queryByTestId("new-subscription-dialog"),
			).not.toBeInTheDocument();

			// 新規登録ボタンクリックで表示
			fireEvent.click(screen.getByText("新規登録"));
			expect(screen.getByTestId("new-subscription-dialog")).toBeInTheDocument();

			// 閉じるボタンクリックで非表示
			fireEvent.click(screen.getByText("閉じる"));
			expect(
				screen.queryByTestId("new-subscription-dialog"),
			).not.toBeInTheDocument();
		});

		it("フォーム送信後の成功メッセージがコンソールに出力されること", async () => {
			const mockCreateMutation = vi.fn().mockResolvedValue({ id: "1" });
			const { useCreateSubscription } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useCreateSubscription).mockReturnValue({
				isLoading: false,
				error: null,
				createSubscription: mockCreateMutation,
			});

			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			render(<SubscriptionsPage />);

			fireEvent.click(screen.getByText("新規登録"));
			fireEvent.click(screen.getByText("送信"));

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"新しいサブスクリプションを登録しました",
				);
			});

			consoleSpy.mockRestore();
		});
	});

	describe("レスポンシブデザイン", () => {
		it("モバイル表示で適切なレイアウトになること", async () => {
			const { container } = render(<SubscriptionsPage />);

			// ヘッダーのレスポンシブクラス
			const header = container.querySelector(".flex-col.sm\\:flex-row");
			expect(header).toBeInTheDocument();

			// ボタンの配置
			const buttonWrapper = container.querySelector(".flex-shrink-0");
			expect(buttonWrapper).toBeInTheDocument();
		});

		it("デスクトップ表示で適切なレイアウトになること", async () => {
			const { container } = render(<SubscriptionsPage />);

			// 最大幅の設定
			const mainContent = container.querySelector(".max-w-7xl");
			expect(mainContent).toBeInTheDocument();

			// パディングの設定
			const paddedContent = container.querySelector(
				".px-4.sm\\:px-6.lg\\:px-8",
			);
			expect(paddedContent).toBeInTheDocument();
		});

		it("統計情報カードがグリッドレイアウトで配置されること", async () => {
			const { container } = render(<SubscriptionsPage />);

			// グリッドコンテナ
			const statsGrid = container.querySelector(
				".grid.grid-cols-1.md\\:grid-cols-2",
			);
			expect(statsGrid).toBeInTheDocument();

			// 統計カード
			const statsCards = container.querySelectorAll(
				".bg-white.rounded-lg.shadow.p-6",
			);
			expect(statsCards).toHaveLength(2);
		});
	});

	describe("アクセシビリティ", () => {
		it("適切な見出し構造になっていること", async () => {
			render(<SubscriptionsPage />);

			// h1タグが1つだけ存在すること
			const h1 = screen.getByRole("heading", { level: 1 });
			expect(h1).toBeInTheDocument();
			expect(h1).toHaveTextContent("サブスクリプション管理");
		});

		it("エラー時の見出し構造が適切であること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "エラー",
			});

			render(<SubscriptionsPage />);

			const h3 = screen.getByRole("heading", { level: 3 });
			expect(h3).toHaveTextContent("データの読み込みに失敗しました");
		});

		it("ボタンに適切なラベルが設定されていること", async () => {
			const { useSubscriptions } = await import(
				"../../lib/api/hooks/useSubscriptions"
			);
			vi.mocked(useSubscriptions).mockReturnValue({
				...defaultSubscriptionsHook,
				error: "エラー",
			});

			render(<SubscriptionsPage />);

			// 新規登録ボタン
			const newButton = screen.getByText("新規登録");
			expect(newButton).toBeInTheDocument();
			expect(newButton.tagName).toBe("BUTTON");

			// 再試行ボタン
			const retryButton = screen.getByText("再試行");
			expect(retryButton).toBeInTheDocument();
			expect(retryButton).toHaveAttribute("type", "button");
		});

		it("統計情報が読み上げ可能な形式になっていること", async () => {
			render(<SubscriptionsPage />);

			// 統計情報のラベルとバリューがセマンティックに配置されている
			expect(screen.getByText("登録サービス数")).toBeInTheDocument();
			expect(screen.getByText("3 サービス")).toBeInTheDocument();

			expect(screen.getByText("月間合計")).toBeInTheDocument();
			expect(screen.getByText("¥8,140")).toBeInTheDocument();
		});
	});
});
