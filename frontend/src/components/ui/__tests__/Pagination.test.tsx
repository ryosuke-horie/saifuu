/**
 * Paginationコンポーネントのテスト
 *
 * ページネーション機能の正常動作を検証
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
	describe("基本レンダリング", () => {
		it("ページネーションコンポーネントが正しくレンダリングされる", () => {
			render(
				<Pagination
					currentPage={1}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			// ページ情報の表示
			expect(screen.getByText("1 / 5")).toBeInTheDocument();
			expect(screen.getByText("全98件")).toBeInTheDocument();

			// ナビゲーションボタン
			expect(screen.getByLabelText("前のページ")).toBeInTheDocument();
			expect(screen.getByLabelText("次のページ")).toBeInTheDocument();

			// 表示件数セレクタ
			expect(screen.getByLabelText("表示件数")).toBeInTheDocument();
		});

		it("最初のページでは前へボタンが無効化される", () => {
			render(
				<Pagination
					currentPage={1}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			const prevButton = screen.getByLabelText("前のページ");
			expect(prevButton).toBeDisabled();
		});

		it("最後のページでは次へボタンが無効化される", () => {
			render(
				<Pagination
					currentPage={5}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			const nextButton = screen.getByLabelText("次のページ");
			expect(nextButton).toBeDisabled();
		});

		it("データがない場合は非表示になる", () => {
			const { container } = render(
				<Pagination
					currentPage={1}
					totalPages={0}
					totalItems={0}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			expect(container.firstChild).toBeNull();
		});
	});

	describe("ユーザー操作", () => {
		it("次へボタンをクリックすると次のページに移動する", () => {
			const handlePageChange = vi.fn();
			render(
				<Pagination
					currentPage={2}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={handlePageChange}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			const nextButton = screen.getByLabelText("次のページ");
			fireEvent.click(nextButton);

			expect(handlePageChange).toHaveBeenCalledWith(3);
		});

		it("前へボタンをクリックすると前のページに移動する", () => {
			const handlePageChange = vi.fn();
			render(
				<Pagination
					currentPage={3}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={handlePageChange}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			const prevButton = screen.getByLabelText("前のページ");
			fireEvent.click(prevButton);

			expect(handlePageChange).toHaveBeenCalledWith(2);
		});

		it("表示件数を変更するとコールバックが呼ばれる", () => {
			const handleItemsPerPageChange = vi.fn();
			render(
				<Pagination
					currentPage={1}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={handleItemsPerPageChange}
				/>,
			);

			const select = screen.getByLabelText("表示件数");
			fireEvent.change(select, { target: { value: "50" } });

			expect(handleItemsPerPageChange).toHaveBeenCalledWith(50);
		});

		it("ページ番号ボタンをクリックすると該当ページに移動する", () => {
			const handlePageChange = vi.fn();
			render(
				<Pagination
					currentPage={1}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={handlePageChange}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			// ページ番号ボタンの存在確認
			const page3Button = screen.getByRole("button", { name: "3ページ目へ" });
			fireEvent.click(page3Button);

			expect(handlePageChange).toHaveBeenCalledWith(3);
		});
	});

	describe("ページ番号表示", () => {
		it("5ページ以下の場合は全ページ番号を表示", () => {
			render(
				<Pagination
					currentPage={1}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			expect(
				screen.getByRole("button", { name: "1ページ目へ" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "2ページ目へ" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "3ページ目へ" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "4ページ目へ" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "5ページ目へ" }),
			).toBeInTheDocument();
		});

		it("多数のページがある場合は省略表示をする", () => {
			render(
				<Pagination
					currentPage={5}
					totalPages={10}
					totalItems={200}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			// 現在のページ周辺と最初・最後のページを表示
			expect(
				screen.getByRole("button", { name: "1ページ目へ" }),
			).toBeInTheDocument();
			// 省略記号が複数ある場合を考慮
			const ellipses = screen.getAllByText("...");
			expect(ellipses.length).toBeGreaterThan(0);
			expect(
				screen.getByRole("button", { name: "10ページ目へ" }),
			).toBeInTheDocument();
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIA属性が設定されている", () => {
			render(
				<Pagination
					currentPage={2}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
				/>,
			);

			const nav = screen.getByRole("navigation", { name: "ページネーション" });
			expect(nav).toBeInTheDocument();

			// 現在のページにaria-current属性
			const currentPageButton = screen.getByRole("button", {
				name: "2ページ目へ",
			});
			expect(currentPageButton).toHaveAttribute("aria-current", "page");
		});
	});

	describe("モバイル対応", () => {
		it("モバイル表示では簡略化された表示になる", () => {
			// window.matchMediaをモック
			Object.defineProperty(window, "matchMedia", {
				writable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query === "(max-width: 640px)",
					media: query,
					onchange: null,
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn(),
				})),
			});

			render(
				<Pagination
					currentPage={2}
					totalPages={5}
					totalItems={98}
					itemsPerPage={20}
					onPageChange={vi.fn()}
					onItemsPerPageChange={vi.fn()}
					isMobile={true}
				/>,
			);

			// モバイルでは簡略表示
			expect(screen.getByText("2 / 5")).toBeInTheDocument();
			// ページ番号ボタンは非表示
			expect(
				screen.queryByRole("button", { name: "3ページ目へ" }),
			).not.toBeInTheDocument();
		});
	});
});
