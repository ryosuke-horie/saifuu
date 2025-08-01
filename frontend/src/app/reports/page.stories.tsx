import type { Meta, StoryObj } from "@storybook/react";
import { HttpResponse, http } from "msw";
import ReportsPage from "./page";

const meta: Meta<typeof ReportsPage> = {
	title: "Pages/ReportsPage (Dynamic)",
	component: ReportsPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Dynamic importを使用してコード分割されたレポートページ。初期バンドルサイズを削減し、パフォーマンスを最適化。",
			},
		},
		msw: {
			handlers: [
				http.get("/api/reports/monthly", () => {
					return HttpResponse.json([]);
				}),
				http.get("/api/reports/category-breakdown", () => {
					return HttpResponse.json({ income: [], expense: [] });
				}),
			],
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"デフォルトの動的インポート状態。ローディング中はPageLoaderが表示される。",
			},
		},
	},
};

export const Loading: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"ページローディング状態の表示。実際のコンポーネント読み込み中の状態をシミュレート。",
			},
		},
	},
};
