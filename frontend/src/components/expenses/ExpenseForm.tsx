"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import {
	validateAmount,
	validateDate,
	validateStringLength,
} from "../../lib/validation/form-validation";
import type {
	ExpenseFormData,
	ExpenseFormProps,
	TransactionType,
} from "../../types/expense";

/**
 * 支出フォームコンポーネント
 *
 * 支出の新規作成・編集を行うフォームコンポーネント
 * バリデーション機能付きの制御されたコンポーネントとして実装
 *
 * 設計方針:
 * - クライアントサイドバリデーションによるUX向上
 * - アクセシビリティに配慮したフォーム実装
 * - エラーハンドリングとローディング状態の適切な表示
 * - 作成・編集両モードに対応した再利用可能な設計
 * - Tailwind CSSによる一貫したスタイリング
 * - 既存のSubscriptionFormパターンを踏襲
 */

// フォームエラーの型定義
interface FormErrors {
	amount?: string;
	type?: string;
	description?: string;
	date?: string;
	categoryId?: string;
}

// デフォルトフォームデータ
const defaultFormData: ExpenseFormData = {
	amount: 0,
	type: "expense" as TransactionType, // 常に支出として扱う
	date: "",
	description: "",
	categoryId: "",
};

// 取引種別マッピング（日本語表示用）
// 現在は支出のみだが、将来の拡張のために残す
const _transactionTypeLabels: Record<TransactionType, string> = {
	expense: "支出",
};

/**
 * 支出登録/編集フォームコンポーネント
 * @param {ExpenseFormProps} props - フォームのプロパティ
 * @param {function} props.onSubmit - フォーム送信時のコールバック関数
 * @param {function} props.onCancel - キャンセルボタン押下時のコールバック関数
 * @param {boolean} [props.isSubmitting=false] - 送信中の状態を示すフラグ
 * @param {ExpenseFormData} [props.initialData] - 編集時の初期データ
 * @param {Category[]} props.categories - カテゴリ一覧
 * @param {string} [props.className=''] - 追加のCSSクラス名
 * @returns {React.ReactElement} フォームコンポーネント
 * @example
 * <ExpenseForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   categories={categories}
 * />
 */
export const ExpenseForm: FC<ExpenseFormProps> = ({
	onSubmit,
	onCancel,
	isSubmitting = false,
	initialData,
	categories,
	className = "",
}) => {
	// フォームデータの状態管理
	const [formData, setFormData] = useState<ExpenseFormData>(
		initialData || defaultFormData,
	);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<
		Record<keyof ExpenseFormData, boolean>
	>({
		amount: false,
		type: false,
		description: false,
		date: false,
		categoryId: false,
	});

	// 初期データが変更された場合の処理
	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	// バリデーション関数
	const validateField = useCallback(
		(field: keyof ExpenseFormData, value: unknown): string | undefined => {
			switch (field) {
				case "amount":
					return validateAmount(value as number);

				case "type":
					// 種別は常に"expense"なのでバリデーション不要
					return undefined;

				case "date":
					return validateDate(value as string);

				case "description":
					return validateStringLength(value as string, 500, "説明");

				default:
					return undefined;
			}
		},
		[],
	);

	// 全フィールドのバリデーション
	const validateForm = useCallback((): FormErrors => {
		const newErrors: FormErrors = {};

		// 金額のバリデーション
		const amountError = validateField("amount", formData.amount);
		if (amountError) {
			newErrors.amount = amountError;
		}

		// 種別のバリデーション
		const typeError = validateField("type", formData.type);
		if (typeError) {
			newErrors.type = typeError;
		}

		// 日付のバリデーション
		const dateError = validateField("date", formData.date);
		if (dateError) {
			newErrors.date = dateError;
		}

		// 説明のバリデーション
		const descriptionError = validateField("description", formData.description);
		if (descriptionError) {
			newErrors.description = descriptionError;
		}

		return newErrors;
	}, [formData, validateField]);

	// フィールド値の変更ハンドラー
	const handleFieldChange = useCallback(
		(field: keyof ExpenseFormData, value: unknown) => {
			setFormData((prev) => ({
				...prev,
				[field]: value,
			}));

			// リアルタイムバリデーション（フィールドがタッチされている場合のみ）
			if (touched[field]) {
				const error = validateField(field, value);
				setErrors((prev) => ({
					...prev,
					[field]: error,
				}));
			}
		},
		[touched, validateField],
	);

	// フィールドのブラーハンドラー
	const handleFieldBlur = useCallback(
		(field: keyof ExpenseFormData) => {
			setTouched((prev) => ({
				...prev,
				[field]: true,
			}));

			// バリデーション実行
			const error = validateField(field, formData[field]);
			setErrors((prev) => ({
				...prev,
				[field]: error,
			}));
		},
		[formData, validateField],
	);

	// 全フィールドをタッチ済みに設定
	const setAllFieldsTouched = useCallback(() => {
		setTouched((prev) => {
			const newTouched = {} as typeof prev;
			(Object.keys(prev) as Array<keyof typeof prev>).forEach((key) => {
				newTouched[key] = true;
			});
			return newTouched;
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

	// カテゴリフィルタリングの最適化
	// 種別が選択されていない場合は全カテゴリを表示
	const filteredCategories = useMemo(
		() =>
			formData.type
				? categories.filter((cat) => cat.type === formData.type)
				: categories,
		[categories, formData.type],
	);

	return (
		<form
			onSubmit={handleSubmit}
			className={`space-y-6 ${className}`}
			noValidate
		>
			{/* 金額 */}
			<div>
				<label
					htmlFor="expense-amount"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					金額（円） <span className="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="expense-amount"
					value={formData.amount || ""}
					onChange={(e) => handleFieldChange("amount", Number(e.target.value))}
					onBlur={() => handleFieldBlur("amount")}
					disabled={isSubmitting}
					min="1"
					max="1000000"
					aria-required="true"
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.amount
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					placeholder="1000"
					aria-invalid={!!errors.amount}
					aria-describedby={errors.amount ? "amount-error" : undefined}
				/>
				{errors.amount && (
					<p
						id="amount-error"
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{errors.amount}
					</p>
				)}
			</div>

			{/* 種別フィールドは削除（常に支出として扱う） */}

			{/* 日付 */}
			<div>
				<label
					htmlFor="expense-date"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					日付 <span className="text-red-500">*</span>
				</label>
				<input
					type="date"
					id="expense-date"
					value={formData.date}
					onChange={(e) => handleFieldChange("date", e.target.value)}
					onBlur={() => handleFieldBlur("date")}
					disabled={isSubmitting}
					required={true}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.date
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					aria-invalid={!!errors.date}
					aria-describedby={errors.date ? "date-error" : undefined}
				/>
				{errors.date && (
					<p id="date-error" className="mt-1 text-sm text-red-600" role="alert">
						{errors.date}
					</p>
				)}
			</div>

			{/* 説明 */}
			<div>
				<label
					htmlFor="expense-description"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					説明（任意）
				</label>
				<textarea
					id="expense-description"
					value={formData.description || ""}
					onChange={(e) => handleFieldChange("description", e.target.value)}
					onBlur={() => handleFieldBlur("description")}
					disabled={isSubmitting}
					rows={3}
					maxLength={500}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed resize-none
						${
							errors.description
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					placeholder="詳細な説明があれば入力してください"
					aria-invalid={!!errors.description}
					aria-describedby={
						errors.description ? "description-error" : "description-help"
					}
				/>
				{errors.description ? (
					<p
						id="description-error"
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{errors.description}
					</p>
				) : (
					<p id="description-help" className="mt-1 text-sm text-gray-500">
						{formData.description ? formData.description.length : 0}/500文字
					</p>
				)}
			</div>

			{/* カテゴリ */}
			<div>
				<label
					htmlFor="expense-category"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					カテゴリ
				</label>
				<select
					id="expense-category"
					value={formData.categoryId}
					onChange={(e) => handleFieldChange("categoryId", e.target.value)}
					onBlur={() => handleFieldBlur("categoryId")}
					disabled={isSubmitting || categories.length === 0}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.categoryId
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
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
				{errors.categoryId && (
					<p
						id="category-error"
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{errors.categoryId}
					</p>
				)}
			</div>

			{/* ボタン */}
			<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="
						px-4 py-2 border border-gray-300 rounded-md shadow-sm
						text-sm font-medium text-gray-700 bg-white
						hover:bg-gray-50 focus:outline-none focus:ring-2
						focus:ring-offset-2 focus:ring-blue-500
						disabled:opacity-50 disabled:cursor-not-allowed
						transition-colors
					"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="
						inline-flex items-center px-4 py-2 border border-transparent
						text-sm font-medium rounded-md shadow-sm text-white
						bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
						focus:ring-offset-2 focus:ring-blue-500 transition-colors
						disabled:opacity-50 disabled:cursor-not-allowed
					"
				>
					{isSubmitting && (
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
					)}
					{initialData ? "更新" : "登録"}
				</button>
			</div>
		</form>
	);
};
