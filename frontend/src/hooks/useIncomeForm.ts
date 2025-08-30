import { useCallback, useEffect, useState } from "react";
import { getToday } from "@/lib/utils/date";
import {
	validateIncomeFieldWithZod,
	validateIncomeFormWithZod,
} from "../lib/validation/validation";
import type { IncomeFormData } from "../types/income";

/**
 * 収入フォームのロジックを管理するカスタムフック
 *
 * 状態管理、バリデーション、イベントハンドラなどの
 * フォームロジックを一元管理
 */

// フォームエラーの型定義
type FormErrors = Partial<Record<keyof IncomeFormData, string>>;

// デフォルトフォームデータ
const defaultFormData: IncomeFormData = {
	amount: 0,
	type: "income",
	date: getToday(), // 今日の日付をデフォルトに
	description: "",
	categoryId: "",
};

interface UseIncomeFormProps {
	initialData?: IncomeFormData;
	onSubmit: (data: IncomeFormData) => Promise<boolean> | boolean;
}

export const useIncomeForm = ({
	initialData,
	onSubmit,
}: UseIncomeFormProps) => {
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
				type: "income", // typeは常に"income"に固定
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
			const newValue = field === "type" ? "income" : value;
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

	// フォームのリセット
	const resetForm = useCallback(() => {
		setFormData({
			amount: 0,
			type: "income",
			date: getToday(), // リセット時も今日の日付にする
			description: "",
			categoryId: "",
		});
		setErrors({});
		setTouched({
			amount: false,
			type: false,
			description: false,
			date: false,
			categoryId: false,
		});
	}, []);

	// フォーム送信ハンドラー
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			// 全フィールドのバリデーション
			const newErrors = validateForm();
			setErrors(newErrors);

			// 全フィールドをタッチ済みに設定
			setAllFieldsTouched();

			// エラーがない場合のみ送信
			if (Object.keys(newErrors).length === 0) {
				const result = await onSubmit(formData);
				return result;
			}
			return false;
		},
		[formData, validateForm, onSubmit, setAllFieldsTouched],
	);

	return {
		formData,
		errors,
		touched,
		handleFieldChange,
		handleFieldBlur,
		handleSubmit,
		resetForm,
	};
};
