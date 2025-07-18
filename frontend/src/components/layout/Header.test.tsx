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
 * - プロパティの適用（title, className）
 * - アクセシビリティ要素
 * - エッジケース処理
 *
 * 注: UI表示・スタイリングテストはStorybookに移行
 */
describe("Header", () => {
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
	});
});
