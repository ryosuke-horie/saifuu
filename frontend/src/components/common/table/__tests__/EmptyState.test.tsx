/**
 * EmptyState コンポーネントのテスト
 *
 * 設計方針:
 * - variant="table" と variant="div" の両方のレンダリングを検証
 * - Hydration エラーの原因となる不正な HTML 構造の防止
 * - 適切な HTML セマンティクスの確認
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
	describe('variant="table"', () => {
		it("テーブル行として正しくレンダリングされる", () => {
			render(
				<table>
					<tbody>
						<EmptyState
							message="テーブル用メッセージ"
							subMessage="サブメッセージ"
							icon="🔍"
							variant="table"
							colSpan={3}
						/>
					</tbody>
				</table>,
			);

			// tr要素が存在することを確認
			const tableRow = screen.getByRole("row");
			expect(tableRow).toBeInTheDocument();

			// td要素が適切な colSpan を持つことを確認
			const tableCell = screen.getByRole("cell");
			expect(tableCell).toHaveAttribute("colSpan", "3");

			// メッセージが表示されることを確認
			expect(screen.getByText("テーブル用メッセージ")).toBeInTheDocument();
			expect(screen.getByText("サブメッセージ")).toBeInTheDocument();
			expect(screen.getByText("🔍")).toBeInTheDocument();
		});

		it("デフォルトでテーブルバリアントが使用される", () => {
			render(
				<table>
					<tbody>
						<EmptyState message="デフォルトメッセージ" />
					</tbody>
				</table>,
			);

			const tableRow = screen.getByRole("row");
			expect(tableRow).toBeInTheDocument();

			const tableCell = screen.getByRole("cell");
			expect(tableCell).toHaveAttribute("colSpan", "5"); // デフォルト値
		});
	});

	describe('variant="div"', () => {
		it("div要素として正しくレンダリングされる", () => {
			render(
				<EmptyState
					message="div用メッセージ"
					subMessage="サブメッセージ"
					icon="💰"
					variant="div"
					className="custom-class"
				/>,
			);

			// div要素として存在することを確認（tr要素ではない）
			const emptyStateDiv = screen
				.getByText("div用メッセージ")
				.closest('div[class*="custom-class"]');
			expect(emptyStateDiv).toBeInTheDocument();
			expect(emptyStateDiv).toHaveClass("custom-class");

			// メッセージが表示されることを確認
			expect(screen.getByText("div用メッセージ")).toBeInTheDocument();
			expect(screen.getByText("サブメッセージ")).toBeInTheDocument();
			expect(screen.getByText("💰")).toBeInTheDocument();

			// table関連の要素が存在しないことを確認
			expect(screen.queryByRole("row")).not.toBeInTheDocument();
			expect(screen.queryByRole("cell")).not.toBeInTheDocument();
		});

		it("div バリアントではcolSpanは無視される", () => {
			render(
				<EmptyState message="colSpan無視テスト" variant="div" colSpan={99} />,
			);

			const emptyStateDiv = screen
				.getByText("colSpan無視テスト")
				.closest("div");
			expect(emptyStateDiv).toBeInTheDocument();
			expect(emptyStateDiv).not.toHaveAttribute("colSpan");
		});
	});

	describe("共通機能", () => {
		it("アイコンなしでも正しく表示される", () => {
			render(<EmptyState message="アイコンなしメッセージ" variant="div" />);

			expect(screen.getByText("アイコンなしメッセージ")).toBeInTheDocument();
			expect(screen.queryByRole("img")).not.toBeInTheDocument();
		});

		it("サブメッセージなしでも正しく表示される", () => {
			render(
				<EmptyState message="メインメッセージのみ" icon="⭐" variant="div" />,
			);

			expect(screen.getByText("メインメッセージのみ")).toBeInTheDocument();
			expect(screen.getByText("⭐")).toBeInTheDocument();
		});

		it("適切なアクセシビリティ属性が設定される", () => {
			render(
				<EmptyState message="アクセシビリティテスト" icon="🔍" variant="div" />,
			);

			const iconElement = screen.getByRole("img", { name: "空状態" });
			expect(iconElement).toBeInTheDocument();
			expect(iconElement).toHaveAttribute("aria-label", "空状態");
		});
	});

	describe("Hydration エラー防止", () => {
		it("テーブルコンテキスト外でdivバリアントを使用する場合、tr要素が含まれない", () => {
			const { container } = render(
				<div>
					<EmptyState message="非テーブルコンテキスト" variant="div" />
				</div>,
			);

			// tr要素が存在しないことを確認
			const trElements = container.querySelectorAll("tr");
			expect(trElements).toHaveLength(0);

			// td要素が存在しないことを確認
			const tdElements = container.querySelectorAll("td");
			expect(tdElements).toHaveLength(0);
		});

		it("テーブルコンテキスト内でテーブルバリアントを使用する場合、適切なHTML構造になる", () => {
			const { container } = render(
				<table>
					<tbody>
						<EmptyState message="テーブルコンテキスト" variant="table" />
					</tbody>
				</table>,
			);

			// 適切なHTML構造を確認
			const tableElement = container.querySelector("table");
			const tbodyElement = tableElement?.querySelector("tbody");
			const trElement = tbodyElement?.querySelector("tr");
			const tdElement = trElement?.querySelector("td");

			expect(tableElement).toBeInTheDocument();
			expect(tbodyElement).toBeInTheDocument();
			expect(trElement).toBeInTheDocument();
			expect(tdElement).toBeInTheDocument();
		});
	});
});
