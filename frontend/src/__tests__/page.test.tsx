import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../app/page";

describe("Home Page", () => {
	it("renders Saifuu title", () => {
		render(<Home />);
		const title = screen.getByRole("heading", { name: "Saifuu" });
		expect(title).toBeInTheDocument();
	});

	it("renders expense management link", () => {
		render(<Home />);
		const expenseLink = screen.getByRole("link", { name: /支出管理ページへ移動/i });
		expect(expenseLink).toBeInTheDocument();
		expect(expenseLink).toHaveAttribute("href", "/expenses");
	});

	it("renders subscription management link", () => {
		render(<Home />);
		const subscriptionLink = screen.getByRole("link", { name: /サブスクリプション管理ページへ移動/i });
		expect(subscriptionLink).toBeInTheDocument();
		expect(subscriptionLink).toHaveAttribute("href", "/subscriptions");
	});

	it("renders navigation with correct aria-label", () => {
		render(<Home />);
		const nav = screen.getByRole("navigation", { name: "メインナビゲーション" });
		expect(nav).toBeInTheDocument();
	});
});
