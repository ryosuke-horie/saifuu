// トランザクション（収入・支出）共通の型定義
// 収入と支出で重複していた型定義を統一し、コードの重複を削減

import type { Category } from "@/types/category";

// トランザクションタイプの定義
export type TransactionType = "income" | "expense";

// APIから取得するトランザクションデータの基本型
export interface Transaction {
	id: string;
	amount: number;
	type: TransactionType;
	categoryId: string;
	date: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

// フォームデータの型（IDは新規作成時には不要）
export type TransactionFormData = Omit<
	Transaction,
	"id" | "createdAt" | "updatedAt"
>;

// トランザクションフォームのプロパティ
export interface TransactionFormProps {
	categories: Category[];
	onSubmit: (data: TransactionFormData) => void;
	isLoading: boolean;
	defaultValues?: Partial<TransactionFormData>;
	type: TransactionType;
}

// トランザクションリストのプロパティ
export interface TransactionListProps {
	transactions: Transaction[];
	categories: Category[];
	onEdit: (transaction: Transaction) => void;
	onDelete: (id: string) => void;
	isLoading: boolean;
	type: TransactionType;
}

// バリデーション結果の型
export interface ValidationResult {
	isValid: boolean;
	errors: {
		[K in keyof TransactionFormData]?: string;
	};
}

// フォーマット済みトランザクションの型
export interface FormattedTransaction extends Transaction {
	formattedAmount: string;
	formattedDate: string;
	categoryName: string;
}

// 統計情報の型
export interface TransactionStatistics {
	total: number;
	count: number;
	average: number;
	byCategory: {
		categoryId: string;
		categoryName: string;
		total: number;
		count: number;
		percentage: number;
	}[];
	byMonth: {
		month: string;
		total: number;
		count: number;
	}[];
}

// トランザクションタイプごとの設定
export interface TransactionTypeConfig {
	type: TransactionType;
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	hoverColor: string;
	messages: {
		addSuccess: string;
		updateSuccess: string;
		deleteSuccess: string;
		loadError: string;
		saveError: string;
		deleteError: string;
	};
}

// トランザクションタイプごとの設定定義
export const TRANSACTION_TYPE_CONFIG: Record<
	TransactionType,
	TransactionTypeConfig
> = {
	income: {
		type: "income",
		label: "収入",
		color: "text-green-600",
		bgColor: "bg-green-50",
		borderColor: "border-green-200",
		hoverColor: "hover:bg-green-100",
		messages: {
			addSuccess: "収入を登録しました",
			updateSuccess: "収入を更新しました",
			deleteSuccess: "収入を削除しました",
			loadError: "収入の取得に失敗しました",
			saveError: "収入の保存に失敗しました",
			deleteError: "収入の削除に失敗しました",
		},
	},
	expense: {
		type: "expense",
		label: "支出",
		color: "text-red-600",
		bgColor: "bg-red-50",
		borderColor: "border-red-200",
		hoverColor: "hover:bg-red-100",
		messages: {
			addSuccess: "支出を登録しました",
			updateSuccess: "支出を更新しました",
			deleteSuccess: "支出を削除しました",
			loadError: "支出の取得に失敗しました",
			saveError: "支出の保存に失敗しました",
			deleteError: "支出の削除に失敗しました",
		},
	},
};
