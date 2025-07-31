// レポートAPIサービス
import type {
	CategoryBreakdown,
	ExportParams,
	MonthlyReport,
	ReportParams,
} from "../types/reports";

// 月別レポートを取得
export async function fetchMonthlyReports(
	params: ReportParams,
): Promise<MonthlyReport[]> {
	const queryParams = new URLSearchParams();
	queryParams.append("period", params.period);

	if (params.startDate) {
		queryParams.append("startDate", params.startDate);
	}
	if (params.endDate) {
		queryParams.append("endDate", params.endDate);
	}

	const response = await fetch(
		`/api/reports/monthly?${queryParams.toString()}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch monthly reports");
	}

	return response.json();
}

// カテゴリ別内訳を取得
export async function fetchCategoryBreakdown(
	params: ReportParams,
): Promise<CategoryBreakdown> {
	const queryParams = new URLSearchParams();
	queryParams.append("period", params.period);

	if (params.startDate) {
		queryParams.append("startDate", params.startDate);
	}
	if (params.endDate) {
		queryParams.append("endDate", params.endDate);
	}

	const response = await fetch(
		`/api/reports/categories?${queryParams.toString()}`,
	);

	if (!response.ok) {
		throw new Error("Failed to fetch category breakdown");
	}

	return response.json();
}

// レポートをCSV形式でエクスポート
export async function exportReportAsCSV(params: ExportParams): Promise<Blob> {
	const queryParams = new URLSearchParams();
	queryParams.append("period", params.period);
	queryParams.append("format", params.format || "csv");

	if (params.startDate) {
		queryParams.append("startDate", params.startDate);
	}
	if (params.endDate) {
		queryParams.append("endDate", params.endDate);
	}

	const response = await fetch(`/api/reports/export?${queryParams.toString()}`);

	if (!response.ok) {
		throw new Error("Failed to export report");
	}

	return response.blob();
}
