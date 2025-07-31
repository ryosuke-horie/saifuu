// レポート関連の型定義

// レポート期間の型
export type ReportPeriod = "3months" | "6months" | "1year" | "custom";

// エクスポート形式の型
export type ExportFormat = "csv" | "json";

// カテゴリ内訳の型
export interface CategoryDetail {
	categoryId: string;
	categoryName: string;
	amount: number;
	type: "income" | "expense";
}

// 月別レポートの型
export interface MonthlyReport {
	month: string; // YYYY-MM形式
	income: number;
	expense: number;
	balance: number;
	savingsRate: number; // パーセンテージ
	categories: CategoryDetail[];
}

// カテゴリ別集計の型
export interface CategorySummary {
	categoryId: string;
	categoryName: string;
	total: number;
	percentage: number; // パーセンテージ
}

// カテゴリ別内訳の型
export interface CategoryBreakdown {
	income: CategorySummary[];
	expense: CategorySummary[];
}

// レポートリクエストパラメータの型
export interface ReportParams {
	period: ReportPeriod;
	startDate?: string; // YYYY-MM-DD形式、customの場合必須
	endDate?: string; // YYYY-MM-DD形式、customの場合必須
}

// エクスポートパラメータの型
export interface ExportParams extends ReportParams {
	format?: ExportFormat;
}
