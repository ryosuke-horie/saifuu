import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

/**
 * Dialogコンポーネントのユニットテスト
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - 表示/非表示の制御
 * - プロパティの動作
 * - キーボード操作（ESCキー）
 * - オーバーレイクリック
 * - フォーカス管理
 * - アクセシビリティ
 * - エッジケース
 */
describe("Dialog", () => {
	// テスト用のモック関数
	const mockOnClose = vi.fn();

	// 各テスト後にモックをリセット
	afterEach(() => {
		mockOnClose.mockClear();
		// body要素のoverflowスタイルをリセット
		document.body.style.overflow = "";
	});

	describe("基本レンダリング", () => {
		it("isOpen=falseの時、何もレンダリングされない", () => {
			render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>ダイアログコンテンツ</p>
				</Dialog>,
			);

			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(
				screen.queryByText("ダイアログコンテンツ"),
			).not.toBeInTheDocument();
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

		it("ダイアログ要素が適切な構造でレンダリングされる", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>テストコンテンツ</p>
				</Dialog>,
			);

			// ダイアログ要素の存在確認
			const dialog = screen.getByRole("dialog");
			expect(dialog).toBeInTheDocument();
			expect(dialog).toHaveAttribute("aria-modal", "true");

			// クローズボタンの存在確認
			const closeButton = screen.getByRole("button", { name: "閉じる" });
			expect(closeButton).toBeInTheDocument();
		});
	});

	describe("プロパティテスト", () => {
		it("titleプロパティが設定されている場合、タイトルが表示される", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose} title="テストタイトル">
					<p>コンテンツ</p>
				</Dialog>,
			);

			const title = screen.getByRole("heading", { level: 2 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent("テストタイトル");
			expect(title).toHaveAttribute("id", "dialog-title");

			// ダイアログのaria-labelledbyが設定されていることを確認
			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
		});

		it("titleプロパティが設定されていない場合、タイトルが表示されない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(screen.queryByRole("heading")).not.toBeInTheDocument();

			// ダイアログのaria-labelledbyが設定されていないことを確認
			const dialog = screen.getByRole("dialog");
			expect(dialog).not.toHaveAttribute("aria-labelledby");
		});

		it("カスタムclassNameが適用される", () => {
			render(
				<Dialog
					isOpen={true}
					onClose={mockOnClose}
					className="custom-dialog-class"
				>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveClass("custom-dialog-class");
		});

		it("childrenが正しくレンダリングされる", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<div data-testid="custom-content">
						<h3>カスタムタイトル</h3>
						<p>カスタムコンテンツ</p>
						<button type="button">カスタムボタン</button>
					</div>
				</Dialog>,
			);

			expect(screen.getByTestId("custom-content")).toBeInTheDocument();
			expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
				"カスタムタイトル",
			);
			expect(screen.getByText("カスタムコンテンツ")).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "カスタムボタン" }),
			).toBeInTheDocument();
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

			// オーバーレイ要素（button role）をクリック
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

		it("ダイアログ内部をクリックしてもonCloseが呼ばれない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const dialog = screen.getByRole("dialog");
			fireEvent.click(dialog);

			expect(mockOnClose).not.toHaveBeenCalled();
		});
	});

	describe("キーボード操作", () => {
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

		it("ESC以外のキーを押してもonCloseが呼ばれない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			fireEvent.keyDown(document, { key: "Enter" });
			fireEvent.keyDown(document, { key: "Space" });
			fireEvent.keyDown(document, { key: "Tab" });

			expect(mockOnClose).not.toHaveBeenCalled();
		});

		it("ダイアログが閉じているときはESCキーが無効", () => {
			render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			fireEvent.keyDown(document, { key: "Escape" });

			expect(mockOnClose).not.toHaveBeenCalled();
		});
	});

	describe("フォーカス管理", () => {
		it("ダイアログが開いたときにダイアログにフォーカスが移動する", async () => {
			// 事前にフォーカス可能な要素を作成
			const button = document.createElement("button");
			button.textContent = "外部ボタン";
			document.body.appendChild(button);
			button.focus();

			expect(document.activeElement).toBe(button);

			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			// setTimeoutのため非同期で待機
			await waitFor(() => {
				const dialog = screen.getByRole("dialog");
				expect(document.activeElement).toBe(dialog);
			});

			// クリーンアップ
			document.body.removeChild(button);
		});

		it("ダイアログが開いているときはbodyのスクロールが無効になる", () => {
			const { rerender } = render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("");

			// ダイアログを開く
			rerender(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("hidden");

			// ダイアログを閉じる
			rerender(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("");
		});

		it("コンポーネントがアンマウントされたときにbodyのスクロールが復元される", () => {
			const { unmount } = render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			expect(document.body.style.overflow).toBe("hidden");

			unmount();

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

		it("オーバーレイにbuttonロールが設定されている", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			expect(overlay).toBeInTheDocument();
		});

		it("SVGアイコンにaria-hidden属性が設定されている", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const svg = screen
				.getByRole("button", { name: "閉じる" })
				.querySelector("svg");
			expect(svg).toHaveAttribute("aria-hidden", "true");
		});
	});

	describe("スタイリング", () => {
		it("基本的なTailwindクラスが適用されている", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			expect(overlay).toHaveClass(
				"fixed",
				"inset-0",
				"z-50",
				"bg-black/50",
				"backdrop-blur-sm",
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveClass(
				"relative",
				"bg-white",
				"rounded-lg",
				"shadow-xl",
			);
		});

		it("アニメーションクラスが適用されている", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			expect(overlay).toHaveClass("animate-in", "fade-in", "duration-200");

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveClass("animate-in", "zoom-in-95", "duration-200");
		});

		it("レスポンシブクラスが適用されている", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const overlay = screen.getByRole("button", {
				name: "ダイアログを閉じる",
			});
			expect(overlay).toHaveClass("p-4", "sm:p-6", "lg:p-8");
		});
	});

	describe("エッジケース", () => {
		it("複数回の開閉が正常に動作する", async () => {
			const { rerender } = render(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			// 開く
			rerender(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);
			expect(screen.getByRole("dialog")).toBeInTheDocument();

			// 閉じる
			rerender(
				<Dialog isOpen={false} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

			// 再度開く
			rerender(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>コンテンツ</p>
				</Dialog>,
			);
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		it("非常に長いタイトルでも正常に表示される", () => {
			const longTitle = "非常に長いタイトルのテストケースです。".repeat(10);
			render(
				<Dialog isOpen={true} onClose={mockOnClose} title={longTitle}>
					<p>コンテンツ</p>
				</Dialog>,
			);

			const title = screen.getByRole("heading", { level: 2 });
			expect(title).toBeInTheDocument();
			expect(title).toHaveTextContent(longTitle);
		});

		it("大量のコンテンツでもスクロール可能", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<div>
						{Array.from({ length: 100 }, (_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: テスト用の静的コンテンツで順序変更がないため安全
							<p key={`content-${i}`}>コンテンツ {i + 1}</p>
						))}
					</div>
				</Dialog>,
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog).toHaveClass("max-h-[90vh]", "overflow-y-auto");
		});

		it("特殊文字を含むコンテンツでも正常に表示される", () => {
			const specialContent = "特殊文字テスト: <>&\"'🎉💰";
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>{specialContent}</p>
				</Dialog>,
			);

			expect(screen.getByText(specialContent)).toBeInTheDocument();
		});

		it("空のchildrenでもエラーにならない", () => {
			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					{null}
				</Dialog>,
			);

			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});
	});

	describe("React Portal", () => {
		it("ダイアログがbody直下にレンダリングされる", () => {
			const container = document.createElement("div");
			container.id = "app-root";
			document.body.appendChild(container);

			render(
				<Dialog isOpen={true} onClose={mockOnClose}>
					<p>ポータルコンテンツ</p>
				</Dialog>,
				{ container },
			);

			// ダイアログはコンテナ内ではなくbody直下に存在する
			const dialog = screen.getByRole("dialog");
			expect(dialog.parentElement?.parentElement).toBe(document.body);
			expect(container.querySelector('[role="dialog"]')).toBeNull();

			// クリーンアップ
			document.body.removeChild(container);
		});
	});
});
