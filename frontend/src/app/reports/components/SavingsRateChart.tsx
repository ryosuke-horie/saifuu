import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CHART_COLORS, CHART_HEIGHTS, formatPercentage } from "../constants";

type SavingsRateData = {
	month: string;
	貯蓄率: number;
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
						<Tooltip formatter={(value: number) => formatPercentage(value)} />
						<Bar dataKey="貯蓄率" fill={CHART_COLORS.purple} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
