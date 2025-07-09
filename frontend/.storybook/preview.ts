import type { Preview } from "@storybook/nextjs";
import { mswLoader } from "msw-storybook-addon";
import "../src/app/globals.css";
import { createElement } from "react";
import { LoggerProvider } from "../src/lib/logger";

const preview: Preview = {
	decorators: [
		(_Story, context) => {
			// Storybook環境変数を設定
			process.env.STORYBOOK = "true";

			// ストーリー固有の設定
			const loggerConfig = {
				level: "debug" as const,
				enableConsole: true,
				bufferSize: 10,
				flushInterval: 1000,
				component: context.title?.split("/").pop(),
				storyName: `${context.title}/${context.name}`,
			};

			return createElement(
				LoggerProvider,
				{ config: loggerConfig },
				createElement(_Story),
			);
		},
	],
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
