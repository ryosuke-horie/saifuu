// not-found.tsx のテスト
// 404ページの表示と機能を検証

import { describe, expect, it } from "vitest";
import { render, screen } from "@/test-utils";
import NotFound from "./not-found";

describe("NotFound", () => {
	describe("基本レンダリング", () => {
		it("404ページの基本要素が表示される", () => {
			render(<NotFound />);

			// 404表示
			expect(screen.getByText("404")).toBeInTheDocument();

			// タイトル
			expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();

			// 説明文
			expect(
				screen.getByText(
					"お探しのページは存在しないか、移動された可能性があります。",
				),
			).toBeInTheDocument();

			// ホームに戻るリンク
			expect(
				screen.getByRole("link", { name: "ホームに戻る" }),
			).toBeInTheDocument();
		});

		it("正しいDOM構造を持つ", () => {
			const { container } = render(<NotFound />);

			// 全体のコンテナ
			const wrapper = container.querySelector(".min-h-screen");
			expect(wrapper).toBeInTheDocument();
			expect(wrapper).toHaveClass(
				"flex",
				"items-center",
				"justify-center",
				"bg-gray-50",
			);

			// カードコンテナ
			const card = container.querySelector(".max-w-md");
			expect(card).toBeInTheDocument();
			expect(card).toHaveClass(
				"w-full",
				"bg-white",
				"rounded-lg",
				"shadow-md",
				"p-8",
				"text-center",
			);
		});
	});

	describe("リンク機能", () => {
		it("ホームに戻るリンクが正しいhref属性を持つ", () => {
			render(<NotFound />);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveAttribute("href", "/");
		});

		it("リンクがNext.js Linkコンポーネントである", () => {
			render(<NotFound />);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			// Next.js Linkコンポーネントはアンカータグとしてレンダリングされる
			expect(homeLink.tagName).toBe("A");
		});
	});

	describe("スタイリング", () => {
		it("404アイコンが適切なスタイルを持つ", () => {
			render(<NotFound />);

			const iconText = screen.getByText("404");
			const iconContainer = iconText.parentElement;

			expect(iconContainer).toHaveClass(
				"inline-flex",
				"items-center",
				"justify-center",
				"w-16",
				"h-16",
				"rounded-full",
				"bg-red-100",
			);
			expect(iconText).toHaveClass("text-2xl", "text-red-600");
		});

		it("タイトルが適切なスタイルを持つ", () => {
			render(<NotFound />);

			const title = screen.getByText("ページが見つかりません");
			expect(title.tagName).toBe("H1");
			expect(title).toHaveClass(
				"text-2xl",
				"font-bold",
				"text-gray-900",
				"mb-2",
			);
		});

		it("説明文が適切なスタイルを持つ", () => {
			render(<NotFound />);

			const description = screen.getByText(
				"お探しのページは存在しないか、移動された可能性があります。",
			);
			expect(description.tagName).toBe("P");
			expect(description).toHaveClass("text-gray-600", "mb-6");
		});

		it("ホームに戻るリンクが適切なスタイルを持つ", () => {
			render(<NotFound />);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toHaveClass(
				"inline-block",
				"w-full",
				"px-6",
				"py-3",
				"bg-blue-600",
				"text-white",
				"font-medium",
				"rounded-md",
				"hover:bg-blue-700",
				"transition-colors",
			);
		});
	});

	describe("アクセシビリティ", () => {
		it("適切な見出し構造を持つ", () => {
			render(<NotFound />);

			const heading = screen.getByRole("heading", {
				name: "ページが見つかりません",
				level: 1,
			});
			expect(heading).toBeInTheDocument();
		});

		it("リンクが適切なロールを持つ", () => {
			render(<NotFound />);

			const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
			expect(homeLink).toBeInTheDocument();
		});

		it("説明的なテキストが提供される", () => {
			render(<NotFound />);

			// ユーザーに状況を説明する明確なテキスト
			expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
			expect(
				screen.getByText(
					"お探しのページは存在しないか、移動された可能性があります。",
				),
			).toBeInTheDocument();
		});
	});

	describe("レスポンシブデザイン", () => {
		it("カードコンテナが最大幅を持つ", () => {
			const { container } = render(<NotFound />);

			const card = container.querySelector(".max-w-md");
			expect(card).toBeInTheDocument();
			expect(card).toHaveClass("w-full");
		});

		it("中央揃えのレイアウトを持つ", () => {
			const { container } = render(<NotFound />);

			const wrapper = container.querySelector(".min-h-screen");
			expect(wrapper).toHaveClass("flex", "items-center", "justify-center");

			const card = container.querySelector(".text-center");
			expect(card).toBeInTheDocument();
		});
	});
});
