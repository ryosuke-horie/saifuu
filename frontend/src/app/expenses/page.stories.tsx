import type { Meta, StoryObj } from "@storybook/react";
import ExpensesPage from "./page";

const meta: Meta<typeof ExpensesPage> = {
	title: "Pages/ExpensesPage (Dynamic)",
	component: ExpensesPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Dynamic importを使用してコード分割された支出管理ページ。初期バンドルサイズを削減し、パフォーマンスを最適化。",
			},
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
