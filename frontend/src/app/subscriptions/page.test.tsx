/**
 * サブスクリプション管理ページのテスト
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@/test-utils";
import { userEvent } from "@testing-library/user-event";
import type { Subscription } from "@/lib/api/types";
import SubscriptionsPage from "./page";

// モックデータ
const mockSubscriptions: Subscription[] = [
	{
		id: "sub1",
		name: "Netflix",
		amount: 1980,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-01",
		category: {
			id: "cat1",
			name: "エンタメ",
			type: "expense",
			color: "#FF6B6B",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		description: "動画配信サービス",
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "sub2",
		name: "Adobe Creative Cloud",
		amount: 72336,
		billingCycle: "yearly",
		nextBillingDate: "2024-12-15",
		category: {
			id: "cat2",
			name: "仕事",
			type: "expense",
			color: "#4ECDC4",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		description: "デザインツール",
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "sub3",
		name: "旧サービス",
		amount: 500,
		billingCycle: "monthly",
		nextBillingDate: "2024-08-10",
		category: null,
		description: "解約済み",
		isActive: false,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// フックのモック
vi.mock("@/lib/api/hooks/useSubscriptions", () => ({
	useSubscriptions: vi.fn(),
	useCreateSubscription: vi.fn(),
}));

import { useSubscriptions, useCreateSubscription } from "@/lib/api/hooks/useSubscriptions";

const mockUseSubscriptions = vi.mocked(useSubscriptions);
const mockUseCreateSubscription = vi.mocked(useCreateSubscription);

// 基本的なモックの戻り値
const defaultMockSubscriptions = {
	subscriptions: mockSubscriptions,
	isLoading: false,
	error: null,
	refetch: vi.fn(),
};

const defaultMockCreateSubscription = {
	createSubscription: vi.fn(),
	isLoading: false,
	error: null,
};

describe("SubscriptionsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSubscriptions.mockReturnValue(defaultMockSubscriptions);
		mockUseCreateSubscription.mockReturnValue(defaultMockCreateSubscription);
	});

	describe("基本的な表示", () => {
		it("ページの必要な要素がすべて表示される", () => {
			render(<SubscriptionsPage />);

			// タイトルと説明
			expect(screen.getByText("サブスクリプション管理")).toBeInTheDocument();
			expect(screen.getByText("定期購読サービスの管理と費用の把握")).toBeInTheDocument();

			// 新規登録ボタン
			expect(screen.getByText("新規登録")).toBeInTheDocument();

			// サブスクリプションリスト（すべて表示される）
			expect(screen.getByText("Netflix")).toBeInTheDocument();
			expect(screen.getByText("Adobe Creative Cloud")).toBeInTheDocument();
			expect(screen.getByText("旧サービス")).toBeInTheDocument(); // 非アクティブも表示される
		});
	});

	describe("統計情報", () => {
		it("統計情報が正しく計算・表示される", () => {
			render(<SubscriptionsPage />);

			// 登録サービス数（全件）
			expect(screen.getByText("登録サービス数")).toBeInTheDocument();
			expect(screen.getByText("3 サービス")).toBeInTheDocument(); // 3件全部表示される

			// 月間合計（年額は月割り計算、アクティブのみ）
			// Netflix: 1,980円 + Adobe: 72,336円/12 = 1,980 + 6,028 = 8,008円
			expect(screen.getByText("月間合計")).toBeInTheDocument();
			expect(screen.getByText("¥8,008")).toBeInTheDocument();

			// 次回請求日（最も近い日付）
			expect(screen.getByText("次回請求")).toBeInTheDocument();
			expect(screen.getByText("8月1日")).toBeInTheDocument();
		});
	});

	describe("新規登録フロー", () => {
		it("新規登録ダイアログが開く", async () => {
			const user = userEvent.setup();
			
			render(<SubscriptionsPage />);

			// ダイアログを開く
			await user.click(screen.getByText("新規登録"));
			
			// ダイアログ内でフォームが表示される
			const dialog = screen.getByRole("dialog");
			expect(within(dialog).getByText("新規サブスクリプション登録")).toBeInTheDocument();
		});

		// 削除: 登録エラーはダイアログ内で処理されるため、ページレベルでは表示されない
	});

	describe("エラー状態", () => {
		it("データ取得エラー時にエラーメッセージと再試行ボタンが表示される", async () => {
			const user = userEvent.setup();
			const mockRefetch = vi.fn();
			mockUseSubscriptions.mockReturnValue({
				subscriptions: [],
				isLoading: false,
				error: "データの取得に失敗しました",
				refetch: mockRefetch,
			});

			render(<SubscriptionsPage />);

			// エラーメッセージ
			expect(screen.getByText("データの読み込みに失敗しました")).toBeInTheDocument();
			expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

			// 再試行ボタン
			const retryButton = screen.getByText("再試行");
			expect(retryButton).toBeInTheDocument();

			// 再試行ボタンをクリック
			await user.click(retryButton);
			expect(mockRefetch).toHaveBeenCalled();
		});
	});

	describe("ローディング状態", () => {
		it("ローディング中の表示が正しい", () => {
			mockUseSubscriptions.mockReturnValue({
				subscriptions: [],
				isLoading: true,
				error: null,
				refetch: vi.fn(),
			});

			render(<SubscriptionsPage />);

			// ローディング表示
			expect(screen.getByTestId("loading-state")).toBeInTheDocument();

			// 統計情報は ... 表示
			expect(screen.getByText("...")).toBeInTheDocument();
		});
	});

	describe("空データ状態", () => {
		it("サブスクリプションがない場合の表示", () => {
			mockUseSubscriptions.mockReturnValue({
				subscriptions: [],
				isLoading: false,
				error: null,
				refetch: vi.fn(),
			});

			render(<SubscriptionsPage />);

			expect(screen.getByText("登録されているサブスクリプションがありません")).toBeInTheDocument();
			expect(screen.getByText("新規登録ボタンから追加してください")).toBeInTheDocument();
		});
	});
});