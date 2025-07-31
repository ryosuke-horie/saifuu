import type { ReportPeriod } from "@/lib/api/types/reports";
import { PERIOD_OPTIONS } from "../constants";

type PeriodFilterProps = {
	value: ReportPeriod;
	onChange: (period: ReportPeriod) => void;
};

/**
 * レポート期間を選択するフィルターコンポーネント
 */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
	return (
		<div className="mb-6">
			<label htmlFor="period" className="block text-sm font-medium mb-2">
				期間
			</label>
			<select
				id="period"
				value={value}
				onChange={(e) => onChange(e.target.value as ReportPeriod)}
				className="border rounded-md px-3 py-2 w-48"
			>
				{PERIOD_OPTIONS.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
