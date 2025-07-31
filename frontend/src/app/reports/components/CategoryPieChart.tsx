import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_HEIGHTS, formatCurrency, PIE_CHART_COLORS } from "../constants";

type CategoryData = {
	categoryId: string;
	categoryName: string;
	total: number;
	percentage: number;
};

type CategoryPieChartProps = {
	data: CategoryData[];
	title: string;
	testId?: string;
};

/**
 * カテゴリ別の内訳を表示する円グラフコンポーネント
 * 収入・支出のカテゴリ別割合を可視化
 */
export function CategoryPieChart({
	data,
	title,
	testId,
}: CategoryPieChartProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow">
			<h2 className="text-xl font-semibold mb-4">{title}</h2>
			<div
				data-testid={testId}
				style={{ width: "100%", height: CHART_HEIGHTS.category }}
			>
				<ResponsiveContainer>
					<PieChart>
						<Pie
							data={data}
							dataKey="total"
							nameKey="categoryName"
							cx="50%"
							cy="50%"
							outerRadius={80}
							label={(entry) => `${entry.categoryName}: ${entry.percentage}%`}
						>
							{data.map((item, index) => (
								<Cell
									key={`${item.categoryId}-${item.categoryName}`}
									fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip formatter={(value: number) => formatCurrency(value)} />
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
