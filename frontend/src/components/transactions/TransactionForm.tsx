// トランザクション（収入・支出）共通フォームコンポーネント
// typeプロパティによって収入・支出を切り替え、共通のUIを提供

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TransactionService } from "@/services/TransactionService";
import type {
	TransactionFormData,
	TransactionFormProps,
} from "@/types/transaction";
import { TRANSACTION_TYPE_CONFIG } from "@/types/transaction";

// フォームのバリデーションスキーマ
const transactionSchema = z.object({
	amount: z
		.number()
		.min(1, "金額は1円以上で入力してください")
		.max(99999999, "金額は99,999,999円以下で入力してください"),
	categoryId: z.string().min(1, "カテゴリを選択してください"),
	date: z.string().min(1, "日付を入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional(),
	type: z.enum(["income", "expense"]),
});

export function TransactionForm({
	categories,
	onSubmit,
	isLoading,
	defaultValues,
	type,
}: TransactionFormProps) {
	const config = TRANSACTION_TYPE_CONFIG[type];

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TransactionFormData>({
		resolver: zodResolver(transactionSchema),
		defaultValues:
			defaultValues || TransactionService.createDefaultFormData(type),
	});

	// フォーム送信処理
	const onFormSubmit = (data: TransactionFormData) => {
		// typeを確実に設定してから送信
		onSubmit({ ...data, type });
	};

	const baseInputClass =
		"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
	const errorInputClass = "border-red-500 focus:ring-red-500";
	const labelClass = "block text-sm font-medium text-gray-700";

	return (
		<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
			{/* 金額入力 */}
			<div className="space-y-2">
				<label htmlFor="amount" className={labelClass}>
					金額 *
				</label>
				<input
					id="amount"
					type="number"
					placeholder="0"
					{...register("amount", { valueAsNumber: true })}
					className={`${baseInputClass} ${errors.amount ? errorInputClass : ""}`}
					disabled={isLoading}
				/>
				{errors.amount && (
					<p className="text-sm text-red-500">{errors.amount.message}</p>
				)}
			</div>

			{/* カテゴリ選択 */}
			<div className="space-y-2">
				<label htmlFor="category" className={labelClass}>
					カテゴリ *
				</label>
				<select
					id="category"
					{...register("categoryId")}
					className={`${baseInputClass} ${errors.categoryId ? errorInputClass : ""}`}
					disabled={isLoading}
				>
					<option value="">カテゴリを選択</option>
					{categories.map((category) => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</select>
				{errors.categoryId && (
					<p className="text-sm text-red-500">{errors.categoryId.message}</p>
				)}
			</div>

			{/* 日付入力 */}
			<div className="space-y-2">
				<label htmlFor="date" className={labelClass}>
					日付 *
				</label>
				<input
					id="date"
					type="date"
					{...register("date")}
					className={`${baseInputClass} ${errors.date ? errorInputClass : ""}`}
					disabled={isLoading}
					max={new Date().toISOString().split("T")[0]}
				/>
				{errors.date && (
					<p className="text-sm text-red-500">{errors.date.message}</p>
				)}
			</div>

			{/* 説明入力 */}
			<div className="space-y-2">
				<label htmlFor="description" className={labelClass}>
					説明（任意）
				</label>
				<textarea
					id="description"
					placeholder={`${config.label}の詳細を入力`}
					{...register("description")}
					className={`${baseInputClass} ${errors.description ? errorInputClass : ""}`}
					disabled={isLoading}
					rows={3}
				/>
				{errors.description && (
					<p className="text-sm text-red-500">{errors.description.message}</p>
				)}
			</div>

			{/* 送信ボタン */}
			<button
				type="submit"
				disabled={isLoading}
				className={`w-full px-4 py-2 text-white font-medium rounded-md transition-colors duration-200 ${
					type === "income"
						? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
						: "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
				} disabled:cursor-not-allowed`}
			>
				{isLoading
					? "保存中..."
					: defaultValues
						? `${config.label}を更新`
						: `${config.label}を登録`}
			</button>
		</form>
	);
}
