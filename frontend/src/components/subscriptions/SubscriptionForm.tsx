"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { getToday } from "@/lib/utils/date";
import type {
	BillingCycle,
	SubscriptionFormData,
	SubscriptionFormProps,
} from "../../lib/api/types";
import {
	createTouchAllFields,
	handleFormKeyboardShortcuts,
} from "../../lib/utils/form-keyboard";

/**
 * サブスクリプションフォームコンポーネント
 *
 * サブスクリプションの新規作成・編集を行うフォームコンポーネント
 * バリデーション機能付きの制御されたコンポーネントとして実装
 *
 * 設計方針:
 * - クライアントサイドバリデーションによるUX向上
 * - アクセシビリティに配慮したフォーム実装
 * - エラーハンドリングとローディング状態の適切な表示
 * - 作成・編集両モードに対応した再利用可能な設計
 * - Tailwind CSSによる一貫したスタイリング
 *
 * 代替案として考慮した実装:
 * - フォームライブラリ(React Hook Form): バンドルサイズと制御の柔軟性から自前実装を選択
 * - スキーマバリデーション(Zod): 現段階では過剰と判断、将来的な拡張を考慮
 */

// フォームエラーの型定義
interface FormErrors {
	name?: string;
	amount?: string;
	billingCycle?: string;
	nextBillingDate?: string;
	categoryId?: string;
	isActive?: string;
	description?: string;
}

// デフォルトフォームデータ
const defaultFormData: SubscriptionFormData = {
	name: "",
	amount: 0,
	billingCycle: "monthly",
	nextBillingDate: getToday(),
	categoryId: "",
	isActive: true,
	description: "",
};

// 請求サイクルマッピング（日本語表示用）
const billingCycleLabels: Record<BillingCycle, string> = {
	monthly: "月額",
	yearly: "年額",
	weekly: "週額",
};

export const SubscriptionForm: FC<SubscriptionFormProps> = ({
	onSubmit,
	onCancel,
	onEscape,
	isSubmitting = false,
	initialData,
	categories,
	className = "",
}) => {
	// フォームデータの状態管理
	const [formData, setFormData] = useState<SubscriptionFormData>(
		initialData || defaultFormData,
	);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<
		Record<keyof SubscriptionFormData, boolean>
	>({
		name: false,
		amount: false,
		billingCycle: false,
		nextBillingDate: false,
		categoryId: false,
		isActive: false,
		description: false,
	});

	// 初期データが変更された場合の処理
	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	// バリデーション関数
	const validateField = useCallback(
		(field: keyof SubscriptionFormData, value: unknown): string | undefined => {
			switch (field) {
				case "name":
					if (
						!value ||
						(typeof value === "string" && value.trim().length === 0)
					) {
						return "サービス名は必須です";
					}
					if (typeof value === "string" && value.trim().length > 100) {
						return "サービス名は100文字以内で入力してください";
					}
					return undefined;

				case "amount":
					if (typeof value !== "number" || value <= 0) {
						return "料金は1円以上で入力してください";
					}
					if (value > 1000000) {
						return "料金は100万円以下で入力してください";
					}
					return undefined;

				case "nextBillingDate":
					if (
						!value ||
						(typeof value === "string" && value.trim().length === 0)
					) {
						return "次回請求日は必須です";
					}
					if (typeof value === "string") {
						const date = new Date(value);
						const today = new Date();
						today.setHours(0, 0, 0, 0);

						if (Number.isNaN(date.getTime())) {
							return "有効な日付を入力してください";
						}
						if (date < today) {
							return "次回請求日は今日以降の日付を入力してください";
						}
					}
					return undefined;

				case "categoryId":
					if (
						!value ||
						(typeof value === "string" && value.trim().length === 0)
					) {
						return "カテゴリは必須です";
					}
					return undefined;

				case "description":
					if (typeof value === "string" && value.length > 500) {
						return "説明は500文字以内で入力してください";
					}
					return undefined;

				default:
					return undefined;
			}
		},
		[],
	);

	// 全フィールドのバリデーション
	const validateForm = useCallback((): FormErrors => {
		const newErrors: FormErrors = {};

		(Object.keys(formData) as Array<keyof SubscriptionFormData>).forEach(
			(field) => {
				const error = validateField(field, formData[field]);
				if (error) {
					newErrors[field] = error;
				}
			},
		);

		return newErrors;
	}, [formData, validateField]);

	// フィールド値の変更ハンドラー
	const handleFieldChange = useCallback(
		(field: keyof SubscriptionFormData, value: unknown) => {
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
		(field: keyof SubscriptionFormData) => {
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

	// 全フィールドをタッチ済みに設定（抽出されたユーティリティを使用）
	// Matt Pocockパターン: as constで厳密な型推論
	const subscriptionFormFields = [
		"name",
		"amount",
		"billingCycle",
		"nextBillingDate",
		"categoryId",
		"isActive",
		"description",
	] as const satisfies ReadonlyArray<keyof SubscriptionFormData>;

	const touchAllFields = useMemo(
		() => createTouchAllFields<SubscriptionFormData>(subscriptionFormFields),
		[subscriptionFormFields],
	);

	const setAllFieldsTouched = useCallback(() => {
		setTouched(touchAllFields());
	}, [touchAllFields]);

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

	// キーボードショートカットハンドラー（抽出されたユーティリティを使用）
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			handleFormKeyboardShortcuts(e, {
				onSubmit: () => handleSubmit(e as unknown as React.FormEvent),
				onEscape,
				isSubmitting,
			});
		},
		[handleSubmit, onEscape, isSubmitting],
	);

	return (
		<form
			onSubmit={handleSubmit}
			onKeyDown={handleKeyDown}
			className={`space-y-6 ${className}`}
			noValidate
			tabIndex={-1}
		>
			{/* サービス名 */}
			<div>
				<label
					htmlFor="subscription-name"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					サービス名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="subscription-name"
					value={formData.name}
					onChange={(e) => handleFieldChange("name", e.target.value)}
					onBlur={() => handleFieldBlur("name")}
					disabled={isSubmitting}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.name
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					placeholder="例: Netflix"
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? "name-error" : undefined}
				/>
				{errors.name && (
					<p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
						{errors.name}
					</p>
				)}
			</div>

			{/* 料金 */}
			<div>
				<label
					htmlFor="subscription-amount"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					料金（円） <span className="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="subscription-amount"
					value={formData.amount || ""}
					onChange={(e) => handleFieldChange("amount", Number(e.target.value))}
					onBlur={() => handleFieldBlur("amount")}
					disabled={isSubmitting}
					min="1"
					max="1000000"
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
					placeholder="1480"
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

			{/* 請求サイクル */}
			<div>
				<label
					htmlFor="subscription-billing-cycle"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					請求サイクル <span className="text-red-500">*</span>
				</label>
				<select
					id="subscription-billing-cycle"
					value={formData.billingCycle}
					onChange={(e) =>
						handleFieldChange("billingCycle", e.target.value as BillingCycle)
					}
					onBlur={() => handleFieldBlur("billingCycle")}
					disabled={isSubmitting}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.billingCycle
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					aria-invalid={!!errors.billingCycle}
					aria-describedby={
						errors.billingCycle ? "billing-cycle-error" : undefined
					}
				>
					{(
						Object.entries(billingCycleLabels) as Array<[BillingCycle, string]>
					).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
				{errors.billingCycle && (
					<p
						id="billing-cycle-error"
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{errors.billingCycle}
					</p>
				)}
			</div>

			{/* 次回請求日 */}
			<div>
				<label
					htmlFor="subscription-next-billing-date"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					次回請求日 <span className="text-red-500">*</span>
				</label>
				<input
					type="date"
					id="subscription-next-billing-date"
					value={formData.nextBillingDate}
					onChange={(e) => handleFieldChange("nextBillingDate", e.target.value)}
					onBlur={() => handleFieldBlur("nextBillingDate")}
					disabled={isSubmitting}
					min={getToday()}
					className={`
						block w-full px-3 py-2 border rounded-md shadow-sm
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						disabled:bg-gray-100 disabled:cursor-not-allowed
						${
							errors.nextBillingDate
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300"
						}
					`}
					aria-invalid={!!errors.nextBillingDate}
					aria-describedby={
						errors.nextBillingDate ? "next-billing-date-error" : undefined
					}
				/>
				{errors.nextBillingDate && (
					<p
						id="next-billing-date-error"
						className="mt-1 text-sm text-red-600"
						role="alert"
					>
						{errors.nextBillingDate}
					</p>
				)}
			</div>

			{/* カテゴリ */}
			<div>
				<label
					htmlFor="subscription-category"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					カテゴリ <span className="text-red-500">*</span>
				</label>
				<select
					id="subscription-category"
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
							{categories
								.filter((cat) => cat.type === "expense") // 支出カテゴリのみ表示
								.map((category) => (
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

			{/* 説明 */}
			<div>
				<label
					htmlFor="subscription-description"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					説明（任意）
				</label>
				<textarea
					id="subscription-description"
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
