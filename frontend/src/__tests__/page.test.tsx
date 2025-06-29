import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../app/page";

describe("Home Page", () => {
	it("renders Next.js logo", () => {
		render(<Home />);
		const logo = screen.getByAltText("Next.js logo");
		expect(logo).toBeInTheDocument();
	});

	it("renders get started text", () => {
		render(<Home />);
		const text = screen.getByText(/Get started by editing/i);
		expect(text).toBeInTheDocument();
	});

	it("renders deploy button", () => {
		render(<Home />);
		const deployButton = screen.getByRole("link", { name: /Deploy now/i });
		expect(deployButton).toBeInTheDocument();
	});
});
