// レポート関連のカスタムフック
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	exportReportAsCSV,
	fetchCategoryBreakdown,
	fetchMonthlyReports,
} from "../services/reports";
import type { ExportParams, ReportParams } from "../types/reports";

// 月別レポートを取得するフック
export function useMonthlyReports(params: ReportParams) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["monthlyReports", params],
		queryFn: () => fetchMonthlyReports(params),
	});

	return {
		reports: data || [],
		isLoading,
		error,
	};
}

// カテゴリ別内訳を取得するフック
export function useCategoryBreakdown(params: ReportParams) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["categoryBreakdown", params],
		queryFn: () => fetchCategoryBreakdown(params),
	});

	return {
		breakdown: data || { income: [], expense: [] },
		isLoading,
		error,
	};
}

// CSVエクスポート機能を提供するフック
export function useExportReport() {
	const [isExporting, setIsExporting] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const exportCSV = async (params: ExportParams) => {
		setIsExporting(true);
		setError(null);

		try {
			const blob = await exportReportAsCSV(params);

			// ダウンロード処理
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
			link.style.display = "none";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(err instanceof Error ? err : new Error("Export failed"));
		} finally {
			setIsExporting(false);
		}
	};

	return {
		exportCSV,
		isExporting,
		error,
	};
}
