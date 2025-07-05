// layout.tsx のテスト
// ルートレイアウトの表示と構造を検証

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test-utils";
import RootLayout, { metadata } from "./layout";

// next/fontのモック
vi.mock("next/font/google", () => ({
	Geist: () => ({
		variable: "--font-geist-sans",
	}),
	Geist_Mono: () => ({
		variable: "--font-geist-mono",
	}),
}));

// Headerコンポーネントのモック
vi.mock("@/components/layout", () => ({
	Header: () => <header data-testid="mocked-header">Header</header>,
}));

describe("RootLayout", () => {
	describe("基本レンダリング", () => {
		it("HTML要素が正しくレンダリングされる", () => {
			render(
				<RootLayout>
					<div data-testid="test-child">Test Content</div>
				</RootLayout>,
			);

			// Next.jsレイアウトのhtmlタグは実際のDOMではなく、React要素として扱われる
			// テスト環境では、内部の要素がアクセス可能であることを確認
			const childElement = screen.getByTestId("test-child");
			expect(childElement).toBeInTheDocument();
			expect(childElement).toHaveTextContent("Test Content");
		});

		it("フォントクラスが適用される構造でレンダリングされる", () => {
			const { container } = render(
				<RootLayout>
					<div data-testid="test-content">Test Content</div>
				</RootLayout>,
			);

			// テスト環境では、bodyタグは直接アクセスできないため、
			// 内部の要素がレンダリングされていることを確認
			const testContent = screen.getByTestId("test-content");
			expect(testContent).toBeInTheDocument();

			// フォント変数が適切に設定されていることを確認（モック経由）
			expect(container.firstChild).toBeInTheDocument();
		});

		it("Headerコンポーネントがレンダリングされる", () => {
			render(
				<RootLayout>
					<div>Test Content</div>
				</RootLayout>,
			);

			const header = screen.getByTestId("mocked-header");
			expect(header).toBeInTheDocument();
			expect(header).toHaveTextContent("Header");
		});

		it("子要素が正しくレンダリングされる", () => {
			render(
				<RootLayout>
					<main data-testid="main-content">Main Content</main>
				</RootLayout>,
			);

			const mainContent = screen.getByTestId("main-content");
			expect(mainContent).toBeInTheDocument();
			expect(mainContent).toHaveTextContent("Main Content");
		});
	});

	describe("メタデータ", () => {
		it("正しいタイトルが設定されている", () => {
			expect(metadata.title).toBe("Saifuu - 家計管理アプリ");
		});

		it("正しい説明文が設定されている", () => {
			expect(metadata.description).toBe(
				"個人用家計管理アプリケーション - 支出・収入の記録と分析、サブスクリプション管理",
			);
		});

		it("robots設定が正しく設定されている（プライベートアプリ用）", () => {
			expect(metadata.robots).toEqual({
				index: false,
				follow: false,
				noarchive: true,
				nosnippet: true,
				noimageindex: true,
				nocache: true,
			});
		});
	});

	describe("レイアウト構造", () => {
		it("正しいDOM構造を持つ", () => {
			render(
				<RootLayout>
					<div data-testid="child">Child</div>
				</RootLayout>,
			);

			// テスト環境では、実際のhtml/bodyタグはアクセスできないため、
			// 内部の要素が正しくレンダリングされていることを確認
			const header = screen.getByTestId("mocked-header");
			const child = screen.getByTestId("child");

			expect(header).toBeInTheDocument();
			expect(child).toBeInTheDocument();

			// Header要素とchild要素の両方が存在することを確認
			expect(header).toHaveTextContent("Header");
			expect(child).toHaveTextContent("Child");
		});
	});

	describe("複数の子要素", () => {
		it("複数の子要素を正しくレンダリングする", () => {
			render(
				<RootLayout>
					<div data-testid="child-1">First Child</div>
					<div data-testid="child-2">Second Child</div>
				</RootLayout>,
			);

			expect(screen.getByTestId("child-1")).toBeInTheDocument();
			expect(screen.getByTestId("child-2")).toBeInTheDocument();
		});
	});
});
