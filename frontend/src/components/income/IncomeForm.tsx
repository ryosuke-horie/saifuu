"use client";

import { type FC, useMemo } from "react";
import { useIncomeForm } from "../../hooks/useIncomeForm";
import type { IncomeFormProps } from "../../types/income";
import { PrimaryButton, SecondaryButton } from "../common/FormComponents";
import { IncomeFormFields } from "./IncomeFormFields";

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
 * - カスタムフックによるロジックの分離
 * - コンポーネントの責務分割
 */

export const IncomeForm: FC<IncomeFormProps> = ({
	onSubmit,
	onCancel,
	isSubmitting = false,
	initialData,
	categories,
	className = "",
}) => {
	// カスタムフックでフォームロジックを管理
	const { formData, errors, handleFieldChange, handleFieldBlur, handleSubmit } =
		useIncomeForm({ initialData, onSubmit });

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
			{/* フォームフィールド */}
			<IncomeFormFields
				formData={formData}
				errors={errors}
				isSubmitting={isSubmitting}
				categories={categories}
				filteredCategories={filteredCategories}
				onFieldChange={handleFieldChange}
				onFieldBlur={handleFieldBlur}
			/>

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
