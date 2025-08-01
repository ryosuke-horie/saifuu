import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

/**
 * Dialogコンポーネントのキーボードナビゲーションテスト
 *
 * Issue #250: キーボードナビゲーションの改善
 * - フォーカストラップの実装
 * - Tabキーでの適切なフォーカス移動
 * - Escapeキーでのダイアログクローズ（既存）
 * - ショートカットキーの実装
 * - フォーカスインジケーターの改善
 */
describe("Dialog - キーボードナビゲーション", () => {
	const mockOnClose = vi.fn();

	afterEach(() => {
		mockOnClose.mockClear();
		document.body.style.overflow = "";
	});

	describe("フォーカストラップ", () => {
		it("ダイアログ内でTabキーを押すとフォーカスがトラップされる", async () => {
			const user = userEvent.setup();

			render(
				<Dialog
					isOpen={true}
					onClose={mockOnClose}
					title="フォーカストラップテスト"
				>
					<button type="button">最初のボタン</button>
					<input type="text" placeholder="入力フィールド" />
					<button type="button">最後のボタン</button>
				</Dialog>,
			);

			// ダイアログが開いた時点でダイアログ自体にフォーカスがある
			await waitFor(() => {
				expect(document.activeElement).toBe(screen.getByRole("dialog"));
			});

			// Tabキーを押すと最初のフォーカス可能な要素（クローズボタン）にフォーカスが移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "閉じる" }),
			);

			// さらにTabキーを押すとコンテンツ内の最初のボタンにフォーカスが移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "最初のボタン" }),
			);

			// 入力フィールドにフォーカスが移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByPlaceholderText("入力フィールド"),
			);

			// 最後のボタンにフォーカスが移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "最後のボタン" }),
			);

			// 最後の要素からTabキーを押すと最初の要素（クローズボタン）に戻る
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "閉じる" }),
			);
		});

		it("Shift+Tabで逆方向にフォーカスが移動し、トラップされる", async () => {
			const user = userEvent.setup();

			render(
				<Dialog
					isOpen={true}
					onClose={mockOnClose}
					title="逆方向フォーカステスト"
				>
					<button type="button">最初のボタン</button>
					<button type="button">最後のボタン</button>
				</Dialog>,
			);

			// クローズボタンにフォーカスを移動
			await user.tab();
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "閉じる" }),
			);

			// Shift+Tabで逆方向に移動すると、最後のボタンにフォーカスが移動
			await user.tab({ shift: true });
			expect(document.activeElement).toBe(
				screen.getByRole("button", { name: "最後のボタン" }),
			);
		});

		it("フォーカス可能な要素がない場合でもエラーにならない", async () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose} title="要素なしテスト">
					<div>フォーカスできない要素のみ</div>
				</Dialog>,
			);

			// エラーなくレンダリングされる
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});
	});

	describe("フォーカス復帰", () => {
		it("ダイアログを閉じると元の要素にフォーカスが戻る", async () => {
			const _user = userEvent.setup();

			const { rerender } = render(
				<div>
					<button type="button" id="trigger">
						ダイアログを開く
					</button>
					<Dialog isOpen={false} onClose={mockOnClose}>
						<p>コンテンツ</p>
					</Dialog>
				</div>,
			);

			// トリガーボタンにフォーカス
			const triggerButton = screen.getByRole("button", {
				name: "ダイアログを開く",
			});
			triggerButton.focus();
			expect(document.activeElement).toBe(triggerButton);

			// ダイアログを開く
			rerender(
				<div>
					<button type="button" id="trigger">
						ダイアログを開く
					</button>
					<Dialog isOpen={true} onClose={mockOnClose}>
						<p>コンテンツ</p>
					</Dialog>
				</div>,
			);

			// ダイアログにフォーカスが移動
			await waitFor(() => {
				expect(document.activeElement).toBe(screen.getByRole("dialog"));
			});

			// ダイアログを閉じる
			rerender(
				<div>
					<button type="button" id="trigger">
						ダイアログを開く
					</button>
					<Dialog isOpen={false} onClose={mockOnClose}>
						<p>コンテンツ</p>
					</Dialog>
				</div>,
			);

			// 元のボタンにフォーカスが戻る
			expect(document.activeElement).toBe(triggerButton);
		});
	});

	describe("カスタムショートカットキー", () => {
		it("カスタムショートカットキーハンドラーを実行できる", async () => {
			const handleShortcut = vi.fn();

			render(
				<Dialog isOpen={true} onClose={mockOnClose} onKeyDown={handleShortcut}>
					<p>ショートカットテスト</p>
				</Dialog>,
			);

			// カスタムキーイベントが処理される
			fireEvent.keyDown(screen.getByRole("dialog"), {
				key: "Enter",
				metaKey: true,
			});

			expect(handleShortcut).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "Enter",
					metaKey: true,
				}),
			);
		});
	});

	describe("アクセシビリティ - フォーカスインジケーター", () => {
		it("フォーカス可能な要素に適切なフォーカスインジケーターがある", () => {
			render(
				<Dialog
					isOpen={true}
					onClose={mockOnClose}
					title="フォーカスインジケーターテスト"
				>
					<button type="button" className="test-button">
						テストボタン
					</button>
				</Dialog>,
			);

			const closeButton = screen.getByRole("button", { name: "閉じる" });

			// クローズボタンにフォーカスリングのスタイルがあることを確認
			expect(closeButton).toHaveClass("focus:ring-2");
			expect(closeButton).toHaveClass("focus:ring-blue-500");
			expect(closeButton).toHaveClass("focus:ring-offset-2");
		});
	});
});
