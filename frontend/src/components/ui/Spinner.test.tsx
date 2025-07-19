import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  // サイズバリエーションのテスト
  it("smサイズの場合、h-4 w-4クラスが適用される", () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("h-4", "w-4");
  });

  it("mdサイズの場合、h-6 w-6クラスが適用される", () => {
    const { container } = render(<Spinner size="md" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("h-6", "w-6");
  });

  it("lgサイズの場合、h-8 w-8クラスが適用される", () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("h-8", "w-8");
  });

  // カラーバリエーションのテスト
  it("primaryカラーの場合、border-blue-600クラスが適用される", () => {
    const { container } = render(<Spinner color="primary" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("border-blue-600");
  });

  it("secondaryカラーの場合、border-gray-600クラスが適用される", () => {
    const { container } = render(<Spinner color="secondary" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("border-gray-600");
  });

  // デフォルト値のテスト
  it("デフォルトではsmサイズとprimaryカラーが適用される", () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("h-4", "w-4", "border-blue-600");
  });

  // アクセシビリティのテスト
  it("適切なaria属性が設定される", () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveAttribute("aria-live", "polite");
    expect(spinner).toHaveAttribute("aria-label", "読み込み中");
  });

  // カスタムクラスのテスト
  it("カスタムクラスを追加できる", () => {
    const { container } = render(<Spinner className="custom-class" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("custom-class");
  });

  // 基本的な構造のテスト
  it("animate-spinクラスでアニメーションが適用される", () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass("animate-spin");
  });
});