import type { Preview } from "@storybook/nextjs";
import { initialize, mswLoader } from "msw-storybook-addon";
import "./test-globals.css";

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
	},
	loaders: [mswLoader],
	tags: ["autodocs"],
};

export default preview;
