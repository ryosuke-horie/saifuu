/**
 * ExpenseFiltersコンポーネント
 *
 * 支出・収入の絞り込み機能を提供するフィルタリングコンポーネント
 * 期間指定、カテゴリ絞り込み、種別絞り込み、金額範囲指定の機能を提供
 * URLパラメータとの双方向バインディングをサポート
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type {
	ExpenseFiltersProps,
	ExpenseFiltersState,
	PeriodType,
} from "../../types/expense";

/**
 * 期間オプション
 */
const PERIOD_OPTIONS: Array<{ value: PeriodType | ""; label: string }> = [
	{ value: "", label: "すべて" },
	{ value: "current_month", label: "今月" },
	{ value: "last_month", label: "先月" },
	{ value: "current_year", label: "今年" },
	{ value: "custom", label: "カスタム期間" },
];

/**
 * 種別オプション
 */
const TYPE_OPTIONS = [
	{ value: "", label: "すべて" },
	{ value: "income", label: "収入のみ" },
	{ value: "expense", label: "支出のみ" },
];

/**
 * URLパラメータからフィルター状態を復元
 */
const parseFiltersFromURL = (
	searchParams: URLSearchParams,
): ExpenseFiltersState => {
	const filters: ExpenseFiltersState = {};

	const type = searchParams.get("type");
	if (type === "income" || type === "expense") {
		filters.type = type;
	}

	const categoryIds = searchParams.get("categoryIds");
	if (categoryIds) {
		filters.categoryIds = categoryIds.split(",");
	}

	const period = searchParams.get("period");
	if (
		period === "current_month" ||
		period === "last_month" ||
		period === "current_year" ||
		period === "custom"
	) {
		filters.period = period;
	}

	const dateFrom = searchParams.get("dateFrom");
	if (dateFrom) {
		filters.dateFrom = dateFrom;
	}

	const dateTo = searchParams.get("dateTo");
	if (dateTo) {
		filters.dateTo = dateTo;
	}

	const minAmount = searchParams.get("minAmount");
	if (minAmount) {
		const amount = Number(minAmount);
		if (!Number.isNaN(amount) && amount >= 0) {
			filters.minAmount = amount;
		}
	}

	const maxAmount = searchParams.get("maxAmount");
	if (maxAmount) {
		const amount = Number(maxAmount);
		if (!Number.isNaN(amount) && amount >= 0) {
			filters.maxAmount = amount;
		}
	}

	return filters;
};

/**
 * フィルター状態をURLパラメータに変換
 */
const buildURLParams = (filters: ExpenseFiltersState): string => {
	const params = new URLSearchParams();

	if (filters.type) {
		params.set("type", filters.type);
	}

	if (filters.categoryIds && filters.categoryIds.length > 0) {
		params.set("categoryIds", filters.categoryIds.join(","));
	}

	if (filters.period) {
		params.set("period", filters.period);
	}

	if (filters.dateFrom) {
		params.set("dateFrom", filters.dateFrom);
	}

	if (filters.dateTo) {
		params.set("dateTo", filters.dateTo);
	}

	if (filters.minAmount !== undefined) {
		params.set("minAmount", filters.minAmount.toString());
	}

	if (filters.maxAmount !== undefined) {
		params.set("maxAmount", filters.maxAmount.toString());
	}

	return params.toString();
};

/**
 * ExpenseFiltersコンポーネント
 */
export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
	onFiltersChange,
	categories,
	initialFilters = {},
	className = "",
	disableUrlSync = false,
}) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [isMobile, setIsMobile] = useState(false);

	const {
		control,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<ExpenseFiltersState>({
		defaultValues: initialFilters,
	});

	// URLパラメータから初期値を読み込む
	useEffect(() => {
		if (!disableUrlSync) {
			const urlFilters = parseFiltersFromURL(searchParams);
			Object.entries(urlFilters).forEach(([key, value]) => {
				setValue(key as keyof ExpenseFiltersState, value);
			});
			if (urlFilters.categoryIds) {
				setSelectedCategories(urlFilters.categoryIds);
			}
		}
	}, [searchParams, setValue, disableUrlSync]);

	// レスポンシブ判定
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.matchMedia("(max-width: 768px)").matches);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// フォームの値を監視
	const watchedValues = watch();

	// フィルター変更を検知して親コンポーネントに通知
	useEffect(() => {
		const filters: ExpenseFiltersState = {
			...watchedValues,
			categoryIds:
				selectedCategories.length > 0 ? selectedCategories : undefined,
		};

		// 空の値を除去
		Object.keys(filters).forEach((key) => {
			const value = filters[key as keyof ExpenseFiltersState];
			if (
				value === "" ||
				value === undefined ||
				(Array.isArray(value) && value.length === 0)
			) {
				delete filters[key as keyof ExpenseFiltersState];
			}
		});

		onFiltersChange(filters);

		// URLパラメータを更新
		if (!disableUrlSync) {
			const queryString = buildURLParams(filters);
			const newURL = queryString ? `${pathname}?${queryString}` : pathname;
			router.replace(newURL);
		}
	}, [
		watchedValues,
		selectedCategories,
		onFiltersChange,
		router,
		pathname,
		disableUrlSync,
	]);

	// リセット処理
	const handleReset = () => {
		reset({});
		setSelectedCategories([]);
		onFiltersChange({});

		if (!disableUrlSync) {
			router.replace(pathname);
		}
	};

	// カテゴリの選択/解除
	const toggleCategory = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId],
		);
	};

	return (
		<div
			data-testid="expense-filters"
			className={`bg-white p-4 rounded-lg shadow-sm space-y-4 ${className}`}
			role="search"
			aria-label="支出・収入フィルター"
		>
			<div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
				{/* 期間フィルター */}
				<div className="flex-1">
					<label
						htmlFor="period"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						期間
					</label>
					<Controller
						name="period"
						control={control}
						render={({ field }) => (
							<select
								{...field}
								id="period"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={field.value || ""}
							>
								{PERIOD_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						)}
					/>
				</div>

				{/* カスタム期間の日付入力 */}
				{watchedValues.period === "custom" && (
					<>
						<div className="flex-1">
							<label
								htmlFor="dateFrom"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								開始日
							</label>
							<Controller
								name="dateFrom"
								control={control}
								render={({ field }) => (
									<input
										{...field}
										type="date"
										id="dateFrom"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								)}
							/>
						</div>
						<div className="flex-1">
							<label
								htmlFor="dateTo"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								終了日
							</label>
							<Controller
								name="dateTo"
								control={control}
								render={({ field }) => (
									<input
										{...field}
										type="date"
										id="dateTo"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								)}
							/>
						</div>
					</>
				)}

				{/* 種別フィルター */}
				<div className="flex-1">
					<label
						htmlFor="type"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						種別
					</label>
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<select
								{...field}
								id="type"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={field.value || ""}
							>
								{TYPE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						)}
					/>
				</div>
			</div>

			{/* カテゴリフィルター */}
			<div>
				<div className="block text-sm font-medium text-gray-700 mb-2">
					カテゴリ
				</div>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
					{categories.map((category) => (
						<label
							key={category.id}
							className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
						>
							<input
								type="checkbox"
								checked={selectedCategories.includes(category.id)}
								onChange={() => toggleCategory(category.id)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								aria-label={category.name}
							/>
							<span
								className="text-sm"
								style={{ color: category.color || "#374151" }}
							>
								{category.name}
							</span>
						</label>
					))}
				</div>
			</div>

			{/* 金額範囲フィルター */}
			<div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
				<div className="flex-1">
					<label
						htmlFor="minAmount"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						最小金額
					</label>
					<Controller
						name="minAmount"
						control={control}
						rules={{
							validate: (value) => {
								if (value === undefined || value === null) return true;
								const num = Number(value);
								if (Number.isNaN(num)) return "有効な数値を入力してください";
								if (num < 0) return "金額は0以上の数値を入力してください";
								return true;
							},
						}}
						render={({ field }) => (
							<input
								{...field}
								type="number"
								id="minAmount"
								placeholder="0"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								onChange={(e) => {
									const value = e.target.value;
									field.onChange(value ? Number(value) : undefined);
								}}
								value={field.value || ""}
							/>
						)}
					/>
					{errors.minAmount && (
						<p className="mt-1 text-sm text-red-600">
							{errors.minAmount.message}
						</p>
					)}
				</div>

				<div className="flex-1">
					<label
						htmlFor="maxAmount"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						最大金額
					</label>
					<Controller
						name="maxAmount"
						control={control}
						rules={{
							validate: (value) => {
								if (value === undefined || value === null) return true;
								const num = Number(value);
								if (Number.isNaN(num)) return "有効な数値を入力してください";
								if (num < 0) return "金額は0以上の数値を入力してください";
								return true;
							},
						}}
						render={({ field }) => (
							<input
								{...field}
								type="number"
								id="maxAmount"
								placeholder="999999"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								onChange={(e) => {
									const value = e.target.value;
									field.onChange(value ? Number(value) : undefined);
								}}
								value={field.value || ""}
							/>
						)}
					/>
					{errors.maxAmount && (
						<p className="mt-1 text-sm text-red-600">
							{errors.maxAmount.message}
						</p>
					)}
				</div>

				{/* リセットボタン */}
				<div className="flex items-end">
					<button
						type="button"
						onClick={handleReset}
						className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						リセット
					</button>
				</div>
			</div>
		</div>
	);
};
