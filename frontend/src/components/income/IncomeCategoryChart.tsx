"use client";

import { memo, useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	BAR_CHART_MARGIN,
	CHART_LABELS,
	CHART_STYLES,
	CHART_TYPES,
	INCOME_COLORS,
	PIE_OUTER_RADIUS,
} from "./constants";
import { useChartState } from "./hooks/useChartState";
import { useIsMobile } from "./hooks/useResponsive";
import type { IncomeCategoryChartProps, IncomeCategoryData } from "./types";
import { formatCurrency, generateSrDescription, getChartColor } from "./utils";

// 型の再エクスポート（後方互換性のため）
export type { IncomeCategoryData } from "./types";

/**
 * データが空の場合のコンポーネント
 */
const EmptyState = memo(() => (
	<div className={CHART_STYLES.noDataContainer}>{CHART_LABELS.noData}</div>
));
EmptyState.displayName = "EmptyState";

/**
 * 切り替えボタンコンポーネント
 */
const ChartToggleButton = memo(
	({ chartType, onClick }: { chartType: string; onClick: () => void }) => (
		<button
			type="button"
			onClick={onClick}
			className={CHART_STYLES.toggleButton}
			aria-label={CHART_LABELS.toggleButton}
		>
			{chartType === CHART_TYPES.PIE
				? CHART_LABELS.toggleToBar
				: CHART_LABELS.toggleToPie}
			に切り替え
		</button>
	),
);
ChartToggleButton.displayName = "ChartToggleButton";

/**
 * 収入カテゴリ別のグラフコンポーネント
 * 円グラフと棒グラフの切り替えが可能
 * 緑系統のカラーパレットを使用して収入データを視覚化
 */
export const IncomeCategoryChart = memo(
	({ data }: IncomeCategoryChartProps) => {
		// カスタムフックでチャート状態を管理
		const {
			chartType,
			selectedCategory,
			toggleChartType,
			handleLegendItemClick,
			isPieChart,
		} = useChartState();

		// レスポンシブ対応
		const isMobile = useIsMobile();

		// スクリーンリーダー用の説明文（メモ化）
		const srDescription = useMemo(() => generateSrDescription(data), [data]);

		// コンテナのクラス名（メモ化）
		const containerClassName = useMemo(
			() =>
				`${CHART_STYLES.container} ${
					isMobile
						? CHART_STYLES.containerMobile
						: CHART_STYLES.containerDesktop
				} flex gap-4`,
			[isMobile],
		);

		// データが空の場合の処理
		if (data.length === 0) {
			return <EmptyState />;
		}

		return (
			<div data-testid="income-category-chart" className={containerClassName}>
				{/* タイトルとコントロール */}
				<div className="w-full">
					<div className={CHART_STYLES.header}>
						<h2 className={CHART_STYLES.title}>{CHART_LABELS.title}</h2>
						<ChartToggleButton
							chartType={chartType}
							onClick={toggleChartType}
						/>
					</div>

					{/* スクリーンリーダー用の説明 */}
					<div
						data-testid="sr-only-description"
						className={CHART_STYLES.srOnly}
					>
						{srDescription}
					</div>

					{/* グラフ表示エリア */}
					<div
						role="img"
						aria-label={CHART_LABELS.chartAriaLabel}
						className={CHART_STYLES.chartArea}
						data-animated="true"
					>
						<ResponsiveContainer width="100%" height="100%">
							{isPieChart ? (
								<PieChart>
									<Pie
										data={data}
										dataKey="amount"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={PIE_OUTER_RADIUS}
										label={(entry) => {
											const { name, percentage } =
												entry as unknown as IncomeCategoryData;
											return `${name}: ${percentage}%`;
										}}
									>
										{data.map((entry, index) => (
											<Cell
												key={`cell-${entry.categoryId}`}
												fill={getChartColor(entry, index, INCOME_COLORS)}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => formatCurrency(value)}
									/>
									<Legend />
								</PieChart>
							) : (
								<BarChart data={data} margin={BAR_CHART_MARGIN}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip
										formatter={(value: number) => formatCurrency(value)}
									/>
									<Legend />
									<Bar dataKey="amount">
										{data.map((entry, index) => (
											<Cell
												key={`cell-${entry.categoryId}`}
												fill={getChartColor(entry, index, INCOME_COLORS)}
											/>
										))}
									</Bar>
								</BarChart>
							)}
						</ResponsiveContainer>
					</div>

					{/* インタラクティブな凡例 */}
					<div className={CHART_STYLES.legendContainer}>
						{data.map((item, index) => (
							<div key={item.categoryId} className={CHART_STYLES.legendItem}>
								<button
									type="button"
									data-testid={`legend-item-${item.categoryId}`}
									onClick={() => handleLegendItemClick(item.categoryId)}
									className={CHART_STYLES.legendButton}
								>
									<div
										className={CHART_STYLES.legendDot}
										style={{
											backgroundColor: getChartColor(
												item,
												index,
												INCOME_COLORS,
											),
										}}
									/>
									<span className={CHART_STYLES.legendText}>{item.name}</span>
								</button>
								{selectedCategory === item.categoryId && (
									<div
										data-testid={`category-detail-${item.categoryId}`}
										className={CHART_STYLES.legendDetail}
									>
										<span>{formatCurrency(item.amount)}</span>
										<span>{item.percentage}%</span>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		);
	},
);

IncomeCategoryChart.displayName = "IncomeCategoryChart";
