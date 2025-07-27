import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import IncomePage from "../page";
import { apiClient } from "@/lib/api";

// APIモック
vi.mock("@/lib/api", () => ({
  apiClient: {
    transactions: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    categories: {
      list: vi.fn(),
    },
  },
}));

describe("IncomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // カテゴリのモックデータ
    vi.mocked(apiClient.categories.list).mockResolvedValue([
      { id: 101, name: "給与", type: "income" },
      { id: 102, name: "ボーナス", type: "income" },
      { id: 103, name: "副業", type: "income" },
    ]);
    // デフォルトで空配列を返す
    vi.mocked(apiClient.transactions.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it("収入管理ページのタイトルが表示される", () => {
    render(<IncomePage />);
    
    expect(screen.getByRole("heading", { name: /収入管理/i })).toBeInTheDocument();
  });

  it("収入登録フォームが表示される", async () => {
    render(<IncomePage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/金額/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/日付/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /登録/i })).toBeInTheDocument();
    });
  });

  it("収入一覧テーブルが表示される", async () => {
    const mockIncomes = [
      {
        id: "1",
        amount: 300000,
        date: "2024-01-25",
        description: "1月給与",
        type: "income" as const,
        category: { id: "101", name: "給与", type: "income" },
        createdAt: "2024-01-25T00:00:00Z",
        updatedAt: "2024-01-25T00:00:00Z",
      },
      {
        id: "2",
        amount: 100000,
        date: "2024-01-15",
        description: "冬季ボーナス",
        type: "income" as const,
        category: { id: "102", name: "ボーナス", type: "income" },
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      },
    ];

    vi.mocked(apiClient.transactions.list).mockResolvedValue({
      data: mockIncomes,
      total: 2,
      page: 1,
      pageSize: 20,
    });

    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText("1月給与")).toBeInTheDocument();
      expect(screen.getByText("冬季ボーナス")).toBeInTheDocument();
      expect(screen.getByText("￥300,000")).toBeInTheDocument();
      expect(screen.getByText("￥100,000")).toBeInTheDocument();
    });
  });

  it("収入を登録できる", async () => {
    const user = userEvent.setup();
    
    vi.mocked(apiClient.transactions.create).mockResolvedValue({
      id: "3",
      amount: 50000,
      date: "2024-01-20",
      description: "副業収入",
      type: "income" as const,
      category: { id: "103", name: "副業", type: "income" },
      createdAt: "2024-01-20T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
    });

    render(<IncomePage />);

    // フォームに入力
    await user.type(screen.getByLabelText(/金額/i), "50000");
    await user.type(screen.getByLabelText(/説明/i), "副業収入");
    
    // カテゴリを選択（フォームがロードされるまで待つ）
    await waitFor(() => {
      const categorySelect = screen.getByLabelText(/カテゴリ/i);
      expect(categorySelect).not.toBeDisabled();
    });
    await user.selectOptions(screen.getByLabelText(/カテゴリ/i), "103");
    
    // 登録ボタンをクリック
    await user.click(screen.getByRole("button", { name: /登録/i }));

    await waitFor(() => {
      expect(apiClient.transactions.create).toHaveBeenCalledWith({
        amount: 50000,
        date: expect.any(String),
        categoryId: expect.any(Number),
        description: "副業収入",
        type: "income",
      });
    });
  });

  it("収入を編集できる", async () => {
    const user = userEvent.setup();
    const mockIncomes = [
      {
        id: "1",
        amount: 300000,
        date: "2024-01-25",
        description: "1月給与",
        type: "income" as const,
        category: { id: "101", name: "給与", type: "income" },
        createdAt: "2024-01-25T00:00:00Z",
        updatedAt: "2024-01-25T00:00:00Z",
      },
    ];

    vi.mocked(apiClient.transactions.list).mockResolvedValue({
      data: mockIncomes,
      total: 1,
      page: 1,
      pageSize: 20,
    });

    vi.mocked(apiClient.transactions.update).mockResolvedValue({
      ...mockIncomes[0],
      amount: 350000,
    });

    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText("1月給与")).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    await user.click(screen.getByRole("button", { name: /編集/i }));

    // 金額を変更
    const amountInput = screen.getByDisplayValue("300000");
    await user.clear(amountInput);
    await user.type(amountInput, "350000");

    // 更新ボタンをクリック
    await user.click(screen.getByRole("button", { name: /更新/i }));

    await waitFor(() => {
      expect(apiClient.transactions.update).toHaveBeenCalledWith("1", {
        amount: 350000,
        date: "2024-01-25",
        categoryId: "101",
        description: "1月給与",
        type: "income",
      });
    });
  });

  it("収入を削除できる", async () => {
    const user = userEvent.setup();
    const mockIncomes = [
      {
        id: "1",
        amount: 300000,
        date: "2024-01-25",
        description: "1月給与",
        type: "income" as const,
        category: { id: "101", name: "給与", type: "income" },
        createdAt: "2024-01-25T00:00:00Z",
        updatedAt: "2024-01-25T00:00:00Z",
      },
    ];

    vi.mocked(apiClient.transactions.list).mockResolvedValue({
      data: mockIncomes,
      total: 1,
      page: 1,
      pageSize: 20,
    });

    vi.mocked(apiClient.transactions.delete).mockResolvedValue(undefined);

    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText("1月給与")).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    await user.click(screen.getByRole("button", { name: /削除/i }));

    // 確認ダイアログで削除を確定
    await user.click(screen.getByRole("button", { name: /削除を確定/i }));

    await waitFor(() => {
      expect(apiClient.transactions.delete).toHaveBeenCalledWith("1");
    });
  });

  it("エラー時に適切なエラーメッセージが表示される", async () => {
    vi.mocked(apiClient.transactions.list).mockRejectedValue(
      new Error("データの取得に失敗しました")
    );

    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText(/データの取得に失敗しました/i)).toBeInTheDocument();
    });
  });

  it("ローディング中はローディング表示がされる", async () => {
    vi.mocked(apiClient.transactions.list).mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    render(<IncomePage />);

    expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
  });
});