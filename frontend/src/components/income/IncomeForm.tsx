"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import {
	validateIncomeFieldWithZod,
	validateIncomeFormWithZod,
} from "../../lib/validation/validation";
import type {
	IncomeFormData,
	IncomeFormProps,
	TransactionType,
} from "../../types/income";

/**
 * 収入フォームコンポーネント
 *
 * 収入の新規作成・編集を行うフォームコンポーネント
 * Zodバリデーション機能付きの制御されたコンポーネントとして実装
 *
 * 設計方針:
 * - Zodスキーマによる型安全なバリデーション
 * - 日本語エラーメッセージの一元管理
 * - 既存コンポーネントとの互換性維持
 * - 緑系統のカラースキーム使用
 */

// フォームエラーの型定義
type FormErrors = Partial<Record<keyof IncomeFormData, string>>;

// デフォルトフォームデータ
const defaultFormData: IncomeFormData = {
	amount: 0,
	type: "income" as TransactionType,
	date: "",
	description: "",
	categoryId: "",
};

// 共通のフィールドスタイルを返すヘルパー関数
const getFieldClassName = (hasError: boolean, disabled = false) => `
	block w-full px-3 py-2 border rounded-md shadow-sm
	focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
	${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
	${hasError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
`;

// エラーメッセージコンポーネント
const ErrorMessage: FC<{ error?: string; id: string }> = ({ error, id }) => {
	if (!error) return null;
	return (
		<p id={id} className="mt-1 text-sm text-red-600" role="alert">
			{error}
		</p>
	);
};

// ラベルコンポーネント
const FormLabel: FC<{
	htmlFor: string;
	required?: boolean;
	children: React.ReactNode;
}> = ({ htmlFor, required = false, children }) => (
	<label
		htmlFor={htmlFor}
		className="block text-sm font-medium text-gray-700 mb-2"
	>
		{children} {required && <span className="text-red-500">*</span>}
	</label>
);

// ボタンのベーススタイル
const buttonBaseStyles =
	"px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

// プライマリボタンコンポーネント
const PrimaryButton: FC<{
	type?: "button" | "submit";
	disabled?: boolean;
	children: React.ReactNode;
	isLoading?: boolean;
}> = ({ type = "button", disabled = false, children, isLoading = false }) => (
	<button
		type={type}
		disabled={disabled}
		className={`${buttonBaseStyles} inline-flex items-center border border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`}
	>
		{isLoading && (
			<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
		)}
		{children}
	</button>
);

// セカンダリボタンコンポーネント
const SecondaryButton: FC<{
	onClick: () => void;
	disabled?: boolean;
	children: React.ReactNode;
}> = ({ onClick, disabled = false, children }) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		className={`${buttonBaseStyles} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-green-500`}
	>
		{children}
	</button>
);

export const IncomeForm: FC<IncomeFormProps> = ({
	onSubmit,
	onCancel,
	isSubmitting = false,
	initialData,
	categories,
	className = "",
}) => {
	// フォームデータの状態管理
	const [formData, setFormData] = useState<IncomeFormData>(
		initialData ? { ...initialData, type: "income" } : defaultFormData,
	);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<Record<keyof IncomeFormData, boolean>>(
		{
			amount: false,
			type: false,
			description: false,
			date: false,
			categoryId: false,
		},
	);

	// 初期データが変更された場合の処理
	useEffect(() => {
		if (initialData) {
			setFormData({
				...initialData,
				type: "income" as TransactionType, // typeは常に"income"に固定
			});
		}
	}, [initialData]);

	// 全フィールドのバリデーション
	const validateForm = useCallback((): FormErrors => {
		const result = validateIncomeFormWithZod(formData);
		return result.errors;
	}, [formData]);

	// フィールド値の変更ハンドラー
	const handleFieldChange = useCallback(
		(field: keyof IncomeFormData, value: unknown) => {
			// typeフィールドは常に"income"に固定
			const newValue = field === "type" ? ("income" as TransactionType) : value;
			setFormData((prev) => ({
				...prev,
				[field]: newValue,
			}));

			// リアルタイムバリデーション（フィールドがタッチされている場合のみ）
			if (touched[field]) {
				const error = validateIncomeFieldWithZod(field, newValue, {
					...formData,
					[field]: newValue,
				});
				setErrors((prev) => ({
					...prev,
					[field]: error,
				}));
			}
		},
		[touched, formData],
	);

	// フィールドのブラーハンドラー
	const handleFieldBlur = useCallback(
		(field: keyof IncomeFormData) => {
			setTouched((prev) => ({
				...prev,
				[field]: true,
			}));

			// バリデーション実行
			const error = validateIncomeFieldWithZod(
				field,
				formData[field],
				formData,
			);
			setErrors((prev) => ({
				...prev,
				[field]: error,
			}));
		},
		[formData],
	);

	// 全フィールドをタッチ済みに設定
	const setAllFieldsTouched = useCallback(() => {
		setTouched({
			amount: true,
			type: true,
			description: true,
			date: true,
			categoryId: true,
		});
	}, []);

	// フォーム送信ハンドラー
	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();

			// 全フィールドのバリデーション
			const newErrors = validateForm();
			setErrors(newErrors);

			// 全フィールドをタッチ済みに設定
			setAllFieldsTouched();

			// エラーがない場合のみ送信
			if (Object.keys(newErrors).length === 0) {
				onSubmit(formData);
			}
		},
		[formData, validateForm, onSubmit, setAllFieldsTouched],
	);

	// カテゴリフィルタリングの最適化（収入カテゴリのみ）
	const filteredCategories = useMemo(
		() => categories.filter((cat) => cat.type === "income"),
		[categories],
	);

	return (
		<form
			onSubmit={handleSubmit}
			className={`income-form space-y-6 ${className}`}
			noValidate
		>
			{/* 金額 */}
			<div>
				<FormLabel htmlFor="income-amount" required>
					金額（円）
				</FormLabel>
				<input
					type="number"
					id="income-amount"
					value={formData.amount || ""}
					onChange={(e) => handleFieldChange("amount", Number(e.target.value))}
					onBlur={() => handleFieldBlur("amount")}
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
					onChange={(e) => handleFieldChange("date", e.target.value)}
					onBlur={() => handleFieldBlur("date")}
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
					onChange={(e) => handleFieldChange("description", e.target.value)}
					onBlur={() => handleFieldBlur("description")}
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
					onChange={(e) => handleFieldChange("categoryId", e.target.value)}
					onBlur={() => handleFieldBlur("categoryId")}
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

			{/* ボタン */}
			<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
				<SecondaryButton onClick={onCancel} disabled={isSubmitting}>
					キャンセル
				</SecondaryButton>
				<PrimaryButton
					type="submit"
					disabled={isSubmitting}
					isLoading={isSubmitting}
				>
					{initialData ? "更新" : "登録"}
				</PrimaryButton>
			</div>
		</form>
	);
};
