import type { FC } from "react";
import type { Category } from "../../lib/api/types";
import type { IncomeFormData } from "../../types/income";
import {
	ErrorMessage,
	FormLabel,
	getFieldClassName,
} from "../common/FormComponents";

/**
 * 収入フォームのフィールドコンポーネント
 *
 * フォームの各入力フィールドをレンダリング
 */

interface IncomeFormFieldsProps {
	formData: IncomeFormData;
	errors: Partial<Record<keyof IncomeFormData, string>>;
	isSubmitting: boolean;
	categories: Category[];
	filteredCategories: Category[];
	onFieldChange: (field: keyof IncomeFormData, value: unknown) => void;
	onFieldBlur: (field: keyof IncomeFormData) => void;
}

export const IncomeFormFields: FC<IncomeFormFieldsProps> = ({
	formData,
	errors,
	isSubmitting,
	categories,
	filteredCategories,
	onFieldChange,
	onFieldBlur,
}) => {
	// 金額入力の処理（NaN対策）
	const handleAmountChange = (value: string) => {
		const numValue = Number(value);
		// NaNの場合は0を設定
		onFieldChange("amount", Number.isNaN(numValue) ? 0 : numValue);
	};

	return (
		<>
			{/* 金額 */}
			<div>
				<FormLabel htmlFor="income-amount" required>
					金額（円）
				</FormLabel>
				<input
					type="number"
					id="income-amount"
					value={formData.amount || ""}
					onChange={(e) => handleAmountChange(e.target.value)}
					onBlur={() => onFieldBlur("amount")}
					disabled={isSubmitting}
					min="1"
					max="10000000"
					aria-required="true"
					className={getFieldClassName(!!errors.amount, isSubmitting)}
					placeholder="50000"
					aria-invalid={!!errors.amount}
					aria-describedby={errors.amount ? "amount-error" : undefined}
				/>
				<ErrorMessage error={errors.amount} id="amount-error" />
			</div>

			{/* 日付 */}
			<div>
				<FormLabel htmlFor="income-date" required>
					日付
				</FormLabel>
				<input
					type="date"
					id="income-date"
					value={formData.date}
					onChange={(e) => onFieldChange("date", e.target.value)}
					onBlur={() => onFieldBlur("date")}
					disabled={isSubmitting}
					required={true}
					className={getFieldClassName(!!errors.date, isSubmitting)}
					aria-invalid={!!errors.date}
					aria-describedby={errors.date ? "date-error" : undefined}
				/>
				<ErrorMessage error={errors.date} id="date-error" />
			</div>

			{/* 説明 */}
			<div>
				<FormLabel htmlFor="income-description">説明（任意）</FormLabel>
				<textarea
					id="income-description"
					value={formData.description || ""}
					onChange={(e) => onFieldChange("description", e.target.value)}
					onBlur={() => onFieldBlur("description")}
					disabled={isSubmitting}
					rows={3}
					className={`${getFieldClassName(!!errors.description, isSubmitting)} resize-none`}
					placeholder="詳細な説明があれば入力してください"
					aria-invalid={!!errors.description}
					aria-describedby={
						errors.description ? "description-error" : "description-help"
					}
				/>
				{errors.description ? (
					<ErrorMessage error={errors.description} id="description-error" />
				) : (
					<p id="description-help" className="mt-1 text-sm text-gray-500">
						{formData.description ? formData.description.length : 0}/500文字
					</p>
				)}
			</div>

			{/* カテゴリ */}
			<div>
				<FormLabel htmlFor="income-category">カテゴリ</FormLabel>
				<select
					id="income-category"
					value={formData.categoryId || ""}
					onChange={(e) => onFieldChange("categoryId", e.target.value)}
					onBlur={() => onFieldBlur("categoryId")}
					disabled={isSubmitting || categories.length === 0}
					className={getFieldClassName(
						!!errors.categoryId,
						isSubmitting || categories.length === 0,
					)}
					aria-invalid={!!errors.categoryId}
					aria-describedby={errors.categoryId ? "category-error" : undefined}
				>
					{categories.length === 0 ? (
						<option value="">カテゴリを読み込み中...</option>
					) : (
						<>
							<option value="">カテゴリを選択してください</option>
							{filteredCategories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</>
					)}
				</select>
				<ErrorMessage error={errors.categoryId} id="category-error" />
			</div>
		</>
	);
};
