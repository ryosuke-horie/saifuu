import "@testing-library/jest-dom";

// React Testing Library の act をVitest環境で利用可能にする
// 参考: https://github.com/testing-library/react-testing-library/issues/1061
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// アラート関数をモック化（vitest globalsを使用）
Object.defineProperty(window, "alert", {
	writable: true,
	value: vi.fn(),
});

// process オブジェクトをブラウザ環境で利用可能にする
if (typeof process === "undefined") {
	Object.defineProperty(globalThis, "process", {
		writable: true,
		value: {
			env: {
				NODE_ENV: "test",
			},
		},
	});
}

// window.matchMediaをモック化（レスポンシブテスト用）
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// MSWのポリフィルを設定（必要に応じて）
if (typeof global !== "undefined" && !global.TextEncoder) {
	const { TextEncoder, TextDecoder } = require("node:util");
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}
