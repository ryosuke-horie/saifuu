import "@testing-library/jest-dom";

// アラート関数をモック化（vitest globalsを使用）
Object.defineProperty(window, "alert", {
	writable: true,
	value: vi.fn(),
});

// process オブジェクトをブラウザ環境で利用可能にする（フォーク環境では不要）
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

// window.matchMediaをモック化（PWAテスト用）
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

// ビジュアルリグレッションテストの設定
// CI環境では無効化し、ブラウザモード時のみ有効
if (!process.env.CI && typeof window !== "undefined" && window.location) {
	try {
		// 動的インポートでブラウザモード専用モジュールを読み込み
		import("@storybook/react").then(({ setProjectAnnotations }) => {
			import("storybook-addon-vis/vitest-setup").then(
				({ vis, visAnnotations }) => {
					setProjectAnnotations([visAnnotations]);
					vis.setup({ auto: true }); // 自動スナップショット設定
				},
			);
		});
	} catch (error) {
		console.warn("Visual regression test setup skipped:", error);
	}
}
