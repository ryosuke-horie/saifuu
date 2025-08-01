import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	CHART_COLORS,
	CHART_DATA_KEYS,
	CHART_HEIGHTS,
	CHART_LABELS,
	formatPercentage,
} from "../constants";

type SavingsRateData = {
	month: string;
	[CHART_DATA_KEYS.savingsRate]: number;
};

type SavingsRateChartProps = {
	data: SavingsRateData[];
};

/**
 * 貯蓄率の推移を表示する棒グラフコンポーネント
 * 月ごとの貯蓄率の変化を可視化
 */
export function SavingsRateChart({ data }: SavingsRateChartProps) {
	return (
		<div className="bg-white p-6 rounded-lg shadow mb-8">
			<h2 className="text-xl font-semibold mb-4">貯蓄率推移</h2>
			<div
				data-testid="savings-rate-chart"
				style={{ width: "100%", height: CHART_HEIGHTS.savingsRate }}
			>
				<ResponsiveContainer>
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip
							formatter={(value: number) => formatPercentage(value)}
							labelFormatter={(label: string) => `${label}月`}
							contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
						/>
						<Bar
							dataKey={CHART_DATA_KEYS.savingsRate}
							fill={CHART_COLORS.purple}
							name={CHART_LABELS[CHART_DATA_KEYS.savingsRate]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
