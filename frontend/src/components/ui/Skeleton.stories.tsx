import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
	title: "UI/Skeleton",
	component: Skeleton,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"コンテンツ読み込み中に表示するスケルトンローダー。様々な形状とパターンを提供します。",
			},
		},
	},
	argTypes: {
		variant: {
			control: "radio",
			options: ["text", "rectangular", "circular"],
			description: "スケルトンの形状",
		},
		width: {
			control: "text",
			description: "幅（数値またはCSS値）",
		},
		height: {
			control: "text",
			description: "高さ（数値またはCSS値）",
		},
		count: {
			control: "number",
			description: "複数行の場合の行数",
		},
		className: {
			control: "text",
			description: "追加のCSSクラス",
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		width: "100%",
		height: 40,
	},
};

export const Text: Story = {
	args: {
		variant: "text",
		width: "100%",
	},
};

export const Rectangular: Story = {
	args: {
		variant: "rectangular",
		width: 200,
		height: 100,
	},
};

export const Circular: Story = {
	args: {
		variant: "circular",
		width: 80,
		height: 80,
	},
};

export const MultipleLines: Story = {
	args: {
		variant: "text",
		count: 3,
		width: "100%",
	},
};

export const Card: Story = {
	render: () => (
		<div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
			<div className="flex items-center mb-4">
				<Skeleton variant="circular" width={48} height={48} />
				<div className="ml-4 flex-1">
					<Skeleton variant="text" width="60%" className="mb-2" />
					<Skeleton variant="text" width="40%" />
				</div>
			</div>
			<Skeleton variant="text" count={3} />
			<div className="mt-4 flex space-x-2">
				<Skeleton variant="rectangular" width={80} height={32} />
				<Skeleton variant="rectangular" width={80} height={32} />
			</div>
		</div>
	),
};

export const Table: Story = {
	render: () => (
		<table className="min-w-full divide-y divide-gray-200">
			<thead className="bg-gray-50">
				<tr>
					<th className="px-4 py-3 text-left">
						<Skeleton variant="text" width="80%" />
					</th>
					<th className="px-4 py-3 text-left">
						<Skeleton variant="text" width="60%" />
					</th>
					<th className="px-4 py-3 text-left">
						<Skeleton variant="text" width="70%" />
					</th>
				</tr>
			</thead>
			<tbody className="bg-white divide-y divide-gray-200">
				{[1, 2, 3].map((i) => (
					<tr key={i}>
						<td className="px-4 py-3">
							<Skeleton variant="text" width="90%" />
						</td>
						<td className="px-4 py-3">
							<Skeleton variant="text" width="70%" />
						</td>
						<td className="px-4 py-3">
							<Skeleton variant="text" width="80%" />
						</td>
					</tr>
				))}
			</tbody>
		</table>
	),
};

export const StatsCard: Story = {
	render: () => (
		<div className="bg-white rounded-lg shadow-sm p-6">
			<Skeleton variant="text" width="75%" height={24} className="mb-4" />
			<div className="space-y-3">
				<Skeleton variant="text" width="100%" />
				<Skeleton variant="text" width="83%" />
				<Skeleton
					variant="rectangular"
					width="50%"
					height={32}
					className="mt-4"
				/>
			</div>
		</div>
	),
};
