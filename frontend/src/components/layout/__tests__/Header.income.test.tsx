import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../Header";

// usePathnameのモック
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("Header - 収入管理メニュー", () => {
  it("収入管理メニューが表示される", () => {
    render(<Header />);
    
    const incomeLink = screen.getByRole("link", { name: /収入管理/i });
    expect(incomeLink).toBeInTheDocument();
    expect(incomeLink).toHaveAttribute("href", "/income");
  });

  it("収入管理メニューに💰アイコンが表示される", () => {
    render(<Header />);
    
    const incomeLink = screen.getByRole("link", { name: /収入管理/i });
    const icon = incomeLink.querySelector('span[aria-hidden="true"]');
    expect(icon).toHaveTextContent("💰");
  });

  it("収入管理ページでメニューがアクティブになる", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/income");
    
    render(<Header />);
    
    const incomeLink = screen.getByRole("link", { name: /収入管理/i });
    expect(incomeLink).toHaveClass("bg-blue-100", "text-blue-700");
    expect(incomeLink).toHaveAttribute("aria-current", "page");
  });
});