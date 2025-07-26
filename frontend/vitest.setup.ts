import "@testing-library/jest-dom";

// React Testing Library の act をVitest環境で利用可能にする
// 参考: https://github.com/testing-library/react-testing-library/issues/1061
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// テスト環境フラグを設定（ErrorBoundaryが開発環境でエラーを再スローしないように）
(globalThis as any).IS_TEST_ENV = true;

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

// navigator.clipboardをモック化
// @testing-library/user-eventとの互換性のため、windowオブジェクトにも設定
const clipboardMock = {
	writeText: vi.fn().mockResolvedValue(undefined),
	readText: vi.fn().mockResolvedValue(""),
	write: vi.fn().mockResolvedValue(undefined),
	read: vi.fn().mockResolvedValue(undefined),
};

Object.defineProperty(navigator, "clipboard", {
	writable: true,
	configurable: true,
	value: clipboardMock,
});

// windowオブジェクトにもclipboardを設定（user-eventが参照する場合があるため）
(window as any).navigator = window.navigator || {};
(window as any).navigator.clipboard = clipboardMock;

// MSWのポリフィルを設定（必要に応じて）
if (typeof global !== "undefined" && !global.TextEncoder) {
	const { TextEncoder, TextDecoder } = require("node:util");
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}

// window.setTimeoutをグローバルに設定（jsdom環境用）
if (typeof window !== "undefined" && !window.setTimeout) {
	window.setTimeout = global.setTimeout;
	window.clearTimeout = global.clearTimeout;
	window.setInterval = global.setInterval;
	window.clearInterval = global.clearInterval;
}
