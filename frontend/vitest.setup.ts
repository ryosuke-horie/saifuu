import "@testing-library/jest-dom";
import { setProjectAnnotations } from "@storybook/react";
import { vis, visAnnotations } from "storybook-addon-vis/vitest-setup";

// アラート関数をモック化（vitest globalsを使用）
Object.defineProperty(window, "alert", {
	writable: true,
	value: vi.fn(),
});

// process オブジェクトをブラウザ環境で利用可能にする
Object.defineProperty(globalThis, "process", {
	writable: true,
	value: {
		env: {
			NODE_ENV: "test",
		},
	},
});

// ビジュアルリグレッションテストの設定
setProjectAnnotations([visAnnotations]);
vis.setup({ auto: true }); // 自動スナップショット設定
