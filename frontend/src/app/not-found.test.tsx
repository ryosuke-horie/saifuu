// not-found.tsx のテスト
// 404ページの表示と機能を検証

import { describe, expect, it } from "vitest";
import { render, screen } from "@/test-utils";
import NotFound from "./not-found";

describe("NotFound", () => {
	it("404ページの必要な要素が全て表示される", () => {
		render(<NotFound />);

		// 必要な要素の存在確認
		expect(screen.getByText("404")).toBeInTheDocument();
		expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
		expect(
			screen.getByText(
				"お探しのページは存在しないか、移動された可能性があります。",
			),
		).toBeInTheDocument();
	});

	it("ホームに戻るリンクが正しく機能する", () => {
		render(<NotFound />);

		const homeLink = screen.getByRole("link", { name: "ホームに戻る" });
		expect(homeLink).toBeInTheDocument();
		expect(homeLink).toHaveAttribute("href", "/");
	});

	it("適切な見出し構造を持つ", () => {
		render(<NotFound />);

		const heading = screen.getByRole("heading", {
			name: "ページが見つかりません",
			level: 1,
		});
		expect(heading).toBeInTheDocument();
	});
});
