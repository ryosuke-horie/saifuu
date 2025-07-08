import type { Preview } from "@storybook/nextjs";
import { initialize, mswLoader } from "msw-storybook-addon";
import "../src/app/globals.css";

// MSWを初期化
initialize();

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		// A11yアドオンの設定
		a11y: {
			config: {
				rules: [
					{
						id: "color-contrast",
						enabled: true,
					},
				],
			},
		},
		// Viewportアドオンの設定
		viewport: {
			viewports: {
				mobile: {
					name: "Mobile",
					styles: {
						width: "375px",
						height: "667px",
					},
				},
				tablet: {
					name: "Tablet",
					styles: {
						width: "768px",
						height: "1024px",
					},
				},
				desktop: {
					name: "Desktop",
					styles: {
						width: "1024px",
						height: "768px",
					},
				},
			},
		},
		// storybook-addon-vis の設定
		vis: {
			// 基本設定
			enable: true,
			// デフォルトの遅延時間（アニメーション完了を待つ）
			delay: 200,
			// 基本的なビューポート設定
			viewports: [
				{
					name: "Mobile",
					width: 375,
					height: 667,
				},
				{
					name: "Tablet",
					width: 768,
					height: 1024,
				},
				{
					name: "Desktop",
					width: 1280,
					height: 800,
				},
			],
			// 比較しきい値の設定
			threshold: 0.1,
			// 差異の許容範囲
			diffThreshold: 0.15,
			// Chromatic設定と連携
			chromatic: {
				// アニメーション完了を待つ時間
				delay: 300,
				// 異なるビューポートでのテスト
				modes: {
					mobile: {
						viewport: "mobile",
						chromatic: { viewports: [375] },
					},
					tablet: {
						viewport: "tablet",
						chromatic: { viewports: [768] },
					},
					desktop: {
						viewport: "desktop",
						chromatic: { viewports: [1200] },
					},
				},
			},
		},
	},
	loaders: [mswLoader],
	tags: ["autodocs"],
};

export default preview;
