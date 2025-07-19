import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  // バリアントのテスト
  it("textバリアントの場合、適切な高さとボーダー半径が適用される", () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("h-4", "rounded");
  });

  it("rectangularバリアントの場合、適切なボーダー半径が適用される", () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("rounded-md");
  });

  it("circularバリアントの場合、円形になる", () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("rounded-full");
  });

  // サイズのテスト
  it("カスタム幅を設定できる", () => {
    const { container } = render(<Skeleton width={200} />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle({ width: "200px" });
  });

  it("カスタム高さを設定できる", () => {
    const { container } = render(<Skeleton height={50} />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle({ height: "50px" });
  });

  it("文字列で幅を設定できる", () => {
    const { container } = render(<Skeleton width="100%" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveStyle({ width: "100%" });
  });

  // 複数行のテスト
  it("countを指定すると複数のスケルトン要素が作成される", () => {
    const { container } = render(<Skeleton variant="text" count={3} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(3);
  });

  it("複数行の場合、最後の行は幅が80%になる", () => {
    const { container } = render(<Skeleton variant="text" count={3} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    const lastSkeleton = skeletons[skeletons.length - 1];
    expect(lastSkeleton).toHaveClass("w-4/5");
  });

  // デフォルト値のテスト
  it("デフォルトではrectangularバリアントが適用される", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("rounded-md");
  });

  // 共通スタイルのテスト
  it("すべてのバリアントにアニメーションとベースクラスが適用される", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("animate-pulse", "bg-gray-200");
  });

  // カスタムクラスのテスト
  it("カスタムクラスを追加できる", () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass("custom-skeleton");
  });

  // アクセシビリティのテスト
  it("適切なaria属性が設定される", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("aria-label", "読み込み中");
  });
});