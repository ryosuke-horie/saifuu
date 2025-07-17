import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

/**
 * Dialogコンポーネントのユニットテスト
 *
 * 重要な動作のみをテスト:
 * - 基本的な開閉動作
 * - クローズ機能（ボタン、オーバーレイ、ESC）
 * - フォーカス管理とスクロールロック
 * - 必須のアクセシビリティ属性
 */
describe("Dialog", () => {
	const mockOnClose = vi.fn();

	afterEach(() => {
		mockOnClose.mockClear();
		document.body.style.overflow = "";
	});

	describe("基本動作", () => {
		it("isOpen=falseの時、何もレンダリングされない", () => {
			render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>ダイアログコンテンツ</p>
				</Dialog>,
			);

			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		it("isOpen=trueの時、ダイアログがレンダリングされる", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>ダイアログコンテンツ</p>
				</Dialog>,
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
			expect(screen.getByText("ダイアログコンテンツ")).toBeInTheDocument();
		});

		it("titleプロパティが設定されている場合、タイトルが表示される", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose} title="テストタイトル">
					<p>コンテンツ</p>
				</Dialog>,
			);

			const title = screen.getByRole("heading", { level: 2 });
			expect(title).toHaveTextContent("テストタイトル");

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
		});
	});

	describe("クローズ機能", () => {
		it("クローズボタンをクリックするとonCloseが呼ばれる", async () => {
			const user = userEvent.setup();
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const closeButton = screen.getByRole("button", { name: "閉じる" });
			await user.click(closeButton);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("オーバーレイをクリックするとonCloseが呼ばれる（デフォルト）", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			fireEvent.click(overlay);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("closeOnOverlayClick=falseの時、オーバーレイクリックでonCloseが呼ばれない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			fireEvent.click(overlay);

			expect(mockOnClose).not.toHaveBeenCalled();
		});

		it("ESCキーを押すとonCloseが呼ばれる（デフォルト）", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			fireEvent.keyDown(document, { key: "Escape" });

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("closeOnEsc=falseの時、ESCキーを押してもonCloseが呼ばれない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose} closeOnEsc={false}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			fireEvent.keyDown(document, { key: "Escape" });

			expect(mockOnClose).not.toHaveBeenCalled();
		});
	});

	describe("フォーカス管理とスクロールロック", () => {
		it("ダイアログが開いたときにダイアログにフォーカスが移動する", async () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			await waitFor(() => {
				const dialog = screen.getByRole("dialog");
				expect(document.activeElement).toBe(dialog);
			});
		});

		it("ダイアログが開いているときはbodyのスクロールが無効になる", () => {
			const { rerender } = render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("");

			rerender(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("hidden");

			rerender(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("");
		});
	});

	describe("アクセシビリティ", () => {
		it("適切なARIA属性が設定されている", () => {
			render(
				<Dialog
					isOpen={true}
					onClose={mockOnClose}
					title="アクセシブルなダイアログ"
				>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-modal", "true");
			expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");

			const closeButton = screen.getByRole("button", { name: "閉じる" });
			expect(closeButton).toHaveAttribute("aria-label", "閉じる");
		});
	});
});
