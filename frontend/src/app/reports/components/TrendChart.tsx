import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CHART_COLORS, CHART_HEIGHTS, formatCurrency } from "../constants";

type TrendData = {
	month: string;
	収入: number;
	支出: number;
	残高: number;
};

type TrendChartProps = {
	data: TrendData[];
};

/**
 * 収支トレンドを表示する折れ線グラフコンポーネント
 * 月ごとの収入・支出・残高の推移を可視化
 */
export function TrendChart({ data }: TrendChartProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow mb-8">
			<h2 className="text-xl font-semibold mb-4">収支トレンド</h2>
			<div
				data-testid="trend-chart"
				style={{ width: "100%", height: CHART_HEIGHTS.trend }}
			>
				<ResponsiveContainer>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip formatter={(value: number) => formatCurrency(value)} />
						<Legend />
						<Line
							type="monotone"
							dataKey="収入"
							stroke={CHART_COLORS.success}
							strokeWidth={2}
						/>
						<Line
							type="monotone"
							dataKey="支出"
							stroke={CHART_COLORS.danger}
							strokeWidth={2}
						/>
						<Line
							type="monotone"
							dataKey="残高"
							stroke={CHART_COLORS.primary}
							strokeWidth={2}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
