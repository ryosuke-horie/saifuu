/**
 * AmountRangeFilterコンポーネント
 *
 * 金額範囲の入力フィルターを提供
 * 最小金額と最大金額を指定可能
 */

import React from "react";
import {
	ARIA_LABELS,
	FILTER_STYLES,
	PLACEHOLDERS,
	VALIDATION_MESSAGES,
} from "../../../constants/incomeFilters";

interface AmountRangeFilterProps {
	/** 最小金額 */
	minAmount?: number;
	/** 最大金額 */
	maxAmount?: number;
	/** 最小金額変更時のコールバック */
	onMinAmountChange: (amount: number | undefined) => void;
	/** 最大金額変更時のコールバック */
	onMaxAmountChange: (amount: number | undefined) => void;
	/** リセットボタンクリック時のコールバック */
	onReset: () => void;
	/** モバイル表示かどうか */
	isMobile?: boolean;
	/** 最小金額のエラー */
	minAmountError?: string;
	/** 最大金額のエラー */
	maxAmountError?: string;
}

/**
 * 金額のバリデーション
 */
const validateAmount = (value: string): string | undefined => {
	if (!value) return undefined;
	const num = Number(value);
	if (Number.isNaN(num)) return VALIDATION_MESSAGES.INVALID_NUMBER;
	if (num < 0) return VALIDATION_MESSAGES.NEGATIVE_AMOUNT;
	return undefined;
};

/**
 * AmountRangeFilterコンポーネント
 */
export const AmountRangeFilter = React.memo<AmountRangeFilterProps>(
	({
		minAmount,
		maxAmount,
		onMinAmountChange,
		onMaxAmountChange,
		onReset,
		isMobile = false,
		minAmountError,
		maxAmountError,
	}) => {
		const [localMinError, setLocalMinError] = React.useState<string>();
		const [localMaxError, setLocalMaxError] = React.useState<string>();

		const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			const error = validateAmount(value);
			setLocalMinError(error);

			// エラーがあってもonChangeは呼び出す（フォームの値を更新するため）
			onMinAmountChange(value ? Number(value) : undefined);
		};

		const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			const error = validateAmount(value);
			setLocalMaxError(error);

			// エラーがあってもonChangeは呼び出す（フォームの値を更新するため）
			onMaxAmountChange(value ? Number(value) : undefined);
		};

		const containerClass = isMobile
			? FILTER_STYLES.FLEX_MOBILE
			: FILTER_STYLES.FLEX_DESKTOP;
		const minError = minAmountError || localMinError;
		const maxError = maxAmountError || localMaxError;

		return (
			<div className={containerClass}>
				{/* 最小金額 */}
				<div className="flex-1">
					<label htmlFor="minAmount" className={FILTER_STYLES.LABEL}>
						{ARIA_LABELS.MIN_AMOUNT}
					</label>
					<input
						type="number"
						id="minAmount"
						value={minAmount ?? ""}
						onChange={handleMinAmountChange}
						placeholder={PLACEHOLDERS.MIN_AMOUNT}
						className={FILTER_STYLES.INPUT}
						aria-label={ARIA_LABELS.MIN_AMOUNT}
						aria-invalid={!!minError}
						aria-describedby={minError ? "minAmount-error" : undefined}
					/>
					{minError && (
						<p id="minAmount-error" className={FILTER_STYLES.ERROR_MESSAGE}>
							{minError}
						</p>
					)}
				</div>

				{/* 最大金額 */}
				<div className="flex-1">
					<label htmlFor="maxAmount" className={FILTER_STYLES.LABEL}>
						{ARIA_LABELS.MAX_AMOUNT}
					</label>
					<input
						type="number"
						id="maxAmount"
						value={maxAmount ?? ""}
						onChange={handleMaxAmountChange}
						placeholder={PLACEHOLDERS.MAX_AMOUNT}
						className={FILTER_STYLES.INPUT}
						aria-label={ARIA_LABELS.MAX_AMOUNT}
						aria-invalid={!!maxError}
						aria-describedby={maxError ? "maxAmount-error" : undefined}
					/>
					{maxError && (
						<p id="maxAmount-error" className={FILTER_STYLES.ERROR_MESSAGE}>
							{maxError}
						</p>
					)}
				</div>

				{/* リセットボタン */}
				<div className="flex items-end">
					<button
						type="button"
						onClick={onReset}
						className={FILTER_STYLES.RESET_BUTTON}
						aria-label={ARIA_LABELS.RESET}
					>
						{ARIA_LABELS.RESET}
					</button>
				</div>
			</div>
		);
	},
);

AmountRangeFilter.displayName = "AmountRangeFilter";
