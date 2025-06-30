import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

// Next.js usePathnameをモック
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(() => "/"),
}));

/**
 * Headerコンポーネントのユニットテスト
 *
 * テスト対象:
 * - デフォルトレンダリング
 * - カスタムプロパティ（title, className）
 * - アクセシビリティ要素の確認
 * - レスポンシブ対応の確認
 */
describe("Header", () => {
	describe("基本レンダリング", () => {
		it("デフォルトプロパティでレンダリングされる", () => {
			render(<Header />);

			// デフォルトタイトルが表示されること
			expect(screen.getByRole("banner")).toBeInTheDocument();
			expect(
				screen.getByRole("heading", { level: 1, name: "Saifuu" }),
			).toBeInTheDocument();
		});

		it("ヘッダー要素が適切な構造でレンダリングされる", () => {
			render(<Header />);

			// header要素の存在確認
			const header = screen.getByRole("banner");
			expect(header).toBeInTheDocument();
			expect(header.tagName).toBe("HEADER");

			// タイトル要素の確認
			const title = screen.getByRole("heading", { level: 1 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent("Saifuu");
		});
	});

	describe("プロパティテスト", () => {
		it("カスタムタイトルが正しく表示される", () => {
			const customTitle = "家計管理アプリ";
			render(<Header title={customTitle} />);

			expect(
				screen.getByRole("heading", { level: 1, name: customTitle }),
			).toBeInTheDocument();
			expect(screen.queryByText("Saifuu")).not.toBeInTheDocument();
		});

		it("カスタムclassNameが適用される", () => {
			const customClassName = "custom-header";
			render(<Header className={customClassName} />);

			const header = screen.getByRole("banner");
			expect(header).toHaveClass(customClassName);
		});

		it("空文字のタイトルでも正常にレンダリングされる", () => {
			render(<Header title="" />);

			const title = screen.getByRole("heading", { level: 1 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent("");
		});

		it("空文字のclassNameでも正常にレンダリングされる", () => {
			render(<Header className="" />);

			const header = screen.getByRole("banner");
			expect(header).toBeInTheDocument();
			// デフォルトクラスは適用されているが、空文字は影響しない
			expect(header.className).not.toBe("");
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なセマンティック要素が使用されている", () => {
			render(<Header />);

			// ヘッダー要素
			expect(screen.getByRole("banner")).toBeInTheDocument();

			// メインナビゲーション
			expect(
				screen.getByRole("navigation", { name: "メインナビゲーション" }),
			).toBeInTheDocument();

			// ロゴの画像ロール
			expect(
				screen.getByRole("img", { name: "Saifuuロゴ" }),
			).toBeInTheDocument();
		});

		it("見出しレベルが適切に設定されている", () => {
			render(<Header />);

			// h1要素が存在し、適切なレベルであること
			const heading = screen.getByRole("heading", { level: 1 });
			expect(heading).toBeInTheDocument();
			expect(heading.tagName).toBe("H1");
		});

		it("aria-labelが適切に設定されている", () => {
			render(<Header />);

			// ナビゲーションのaria-label
			const nav = screen.getByRole("navigation");
			expect(nav).toHaveAttribute("aria-label", "メインナビゲーション");

			// ロゴのaria-label
			const logo = screen.getByRole("img");
			expect(logo).toHaveAttribute("aria-label", "Saifuuロゴ");
		});
	});

	describe("スタイリング", () => {
		it("基本的なTailwindクラスが適用されている", () => {
			render(<Header />);

			const header = screen.getByRole("banner");

			// 基本レイアウトクラスの確認
			expect(header).toHaveClass("sticky", "top-0", "z-50", "w-full");

			// 背景クラスの確認
			expect(header).toHaveClass("bg-white/80");

			// ボーダー・影効果の確認
			expect(header).toHaveClass("border-b", "border-gray-200");
			expect(header).toHaveClass("backdrop-blur-md", "shadow-sm");
		});

		it("レスポンシブ対応のクラスが適用されている", () => {
			render(<Header />);

			// コンテナのレスポンシブクラス
			const container = screen.getByRole("banner").querySelector("div");
			expect(container).toHaveClass(
				"container",
				"mx-auto",
				"px-4",
				"sm:px-6",
				"lg:px-8",
			);

			// タイトルのレスポンシブフォントサイズ
			const title = screen.getByRole("heading", { level: 1 });
			expect(title).toHaveClass("text-xl", "sm:text-2xl");
		});
	});

	describe("レイアウト構造", () => {
		it("適切なレイアウト構造が構築されている", () => {
			render(<Header />);

			const header = screen.getByRole("banner");

			// コンテナ要素の存在
			const container = header.querySelector(".container");
			expect(container).toBeInTheDocument();

			// フレックスレイアウトの適用
			const flexContainer = container?.querySelector(
				".flex.items-center.justify-between",
			);
			expect(flexContainer).toBeInTheDocument();

			// ロゴ・タイトル部分とナビゲーション部分の存在
			const logoSection = flexContainer?.querySelector(
				".flex.items-center.space-x-3",
			);
			const navSection = screen.getByRole("navigation");
			expect(logoSection).toBeInTheDocument();
			expect(navSection).toBeInTheDocument();
		});

		it("ロゴ要素が適切に配置されている", () => {
			render(<Header />);

			const logo = screen.getByRole("img", { name: "Saifuuロゴ" });

			// ロゴのスタイリング確認
			expect(logo).toHaveClass(
				"flex",
				"items-center",
				"justify-center",
				"w-8",
				"h-8",
				"rounded-lg",
				"bg-gradient-to-br",
				"from-blue-500",
				"to-purple-600",
			);

			// ロゴ内のテキスト確認
			expect(logo).toHaveTextContent("¥");
		});
	});

	describe("エッジケース", () => {
		it("undefined値のプロパティでも正常に動作する", () => {
			render(<Header title={undefined} className={undefined} />);

			const header = screen.getByRole("banner");
			const title = screen.getByRole("heading", { level: 1 });

			expect(header).toBeInTheDocument();
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent("Saifuu"); // デフォルト値が使用される
		});

		it("非常に長いタイトルでも正常に表示される", () => {
			const longTitle = "非常に長いタイトルのテストケースです。".repeat(10);
			render(<Header title={longTitle} />);

			const title = screen.getByRole("heading", { level: 1 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent(longTitle);
		});

		it("特殊文字を含むタイトルでも正常に表示される", () => {
			const specialTitle = "家計管理📊💰アプリ <>&\"'";
			render(<Header title={specialTitle} />);

			const title = screen.getByRole("heading", { level: 1 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent(specialTitle);
		});

		it("複数のカスタムクラスが適用される", () => {
			const multipleClasses = "class1 class2 class3";
			render(<Header className={multipleClasses} />);

			const header = screen.getByRole("banner");
			expect(header).toHaveClass("class1", "class2", "class3");
		});
	});
});
