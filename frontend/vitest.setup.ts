import "@testing-library/jest-dom";

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

// ビジュアルリグレッションテストの設定
// ブラウザモードでビジュアルテストを実行する場合のみ有効
// CI環境でも ENABLE_VISUAL_TESTS=true の場合は有効化
const shouldEnableVisualTests =
	process.env.ENABLE_VISUAL_TESTS === "true" &&
	typeof window !== "undefined" &&
	window.location;

if (shouldEnableVisualTests) {
	try {
		// 動的インポートでブラウザモード専用モジュールを読み込み
		import("@storybook/react")
			.then(({ setProjectAnnotations }) => {
				import("storybook-addon-vis/vitest-setup").then(
					({ vis, visAnnotations }) => {
						setProjectAnnotations([visAnnotations]);
						vis.setup({
							auto: true, // 自動スナップショット設定
						});
					},
				);
			})
			.catch((error) => {
				console.warn("Visual regression test setup failed:", error);
			});
	} catch (error) {
		console.warn("Visual regression test setup skipped:", error);
	}
}

// Storybook integration removed to prevent hanging
// Visual regression tests are handled separately in Storybook environment
