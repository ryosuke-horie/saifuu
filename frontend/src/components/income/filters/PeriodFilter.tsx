/**
 * PeriodFilterコンポーネント
 * 
 * 期間選択とカスタム日付範囲の入力を提供
 * 期間タイプに応じて日付入力フィールドを動的に表示
 */

import React from "react";
import { ARIA_LABELS, FILTER_STYLES, PERIOD_OPTIONS } from "../../../constants/incomeFilters";
import type { IncomePeriodType } from "../../../types/income";

interface PeriodFilterProps {
	/** 選択されている期間 */
	period?: IncomePeriodType | "";
	/** 開始日 */
	startDate?: string;
	/** 終了日 */
	endDate?: string;
	/** 期間変更時のコールバック */
	onPeriodChange: (period: IncomePeriodType | "") => void;
	/** 開始日変更時のコールバック */
	onStartDateChange: (date: string) => void;
	/** 終了日変更時のコールバック */
	onEndDateChange: (date: string) => void;
	/** モバイル表示かどうか */
	isMobile?: boolean;
}

/**
 * PeriodFilterコンポーネント
 */
export const PeriodFilter = React.memo<PeriodFilterProps>(({
	period = "",
	startDate,
	endDate,
	onPeriodChange,
	onStartDateChange,
	onEndDateChange,
	isMobile = false,
}) => {
	const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onPeriodChange(e.target.value as IncomePeriodType | "");
	};

	const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onStartDateChange(e.target.value);
	};

	const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onEndDateChange(e.target.value);
	};

	const containerClass = isMobile ? FILTER_STYLES.FLEX_MOBILE : FILTER_STYLES.FLEX_DESKTOP;

	return (
		<div className={containerClass}>
			{/* 期間選択 */}
			<div className="flex-1">
				<label
					htmlFor="period"
					className={FILTER_STYLES.LABEL}
				>
					{ARIA_LABELS.PERIOD}
				</label>
				<select
					id="period"
					value={period}
					onChange={handlePeriodChange}
					className={FILTER_STYLES.SELECT}
					aria-label={ARIA_LABELS.PERIOD}
				>
					{PERIOD_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* カスタム期間の日付入力 */}
			{period === "custom" && (
				<>
					<div className="flex-1">
						<label
							htmlFor="startDate"
							className={FILTER_STYLES.LABEL}
						>
							{ARIA_LABELS.START_DATE}
						</label>
						<input
							type="date"
							id="startDate"
							value={startDate || ""}
							onChange={handleStartDateChange}
							className={FILTER_STYLES.INPUT}
							aria-label={ARIA_LABELS.START_DATE}
						/>
					</div>
					<div className="flex-1">
						<label
							htmlFor="endDate"
							className={FILTER_STYLES.LABEL}
						>
							{ARIA_LABELS.END_DATE}
						</label>
						<input
							type="date"
							id="endDate"
							value={endDate || ""}
							onChange={handleEndDateChange}
							className={FILTER_STYLES.INPUT}
							aria-label={ARIA_LABELS.END_DATE}
						/>
					</div>
				</>
			)}
		</div>
	);
});

PeriodFilter.displayName = "PeriodFilter";