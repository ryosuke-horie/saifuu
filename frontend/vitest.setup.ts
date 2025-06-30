import "@testing-library/jest-dom";

// アラート関数をモック化（vitest globalsを使用）
Object.defineProperty(window, "alert", {
	writable: true,
	value: vi.fn(),
});
