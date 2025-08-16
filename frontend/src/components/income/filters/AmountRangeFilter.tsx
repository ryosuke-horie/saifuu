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
        /** 範囲を自動補正するか */
        autoCorrect?: boolean;
}

interface ValidationResult {
        isValid: boolean;
        errors: string[];
}

/**
 * 金額範囲のバリデーション
 */
const validateAmountRange = (
        min?: number,
        max?: number,
): ValidationResult => {
        const errors: string[] = [];
        if (min !== undefined && min < 0) {
                errors.push(VALIDATION_MESSAGES.NEGATIVE_MIN);
        }
        if (max !== undefined && max < 0) {
                errors.push(VALIDATION_MESSAGES.NEGATIVE_MAX);
        }
        if (min !== undefined && max !== undefined && min > max) {
                errors.push(VALIDATION_MESSAGES.MIN_GREATER_THAN_MAX);
        }
        const MAX_AMOUNT = 100_000_000;
        if (min !== undefined && min > MAX_AMOUNT) {
                errors.push(VALIDATION_MESSAGES.AMOUNT_TOO_LARGE);
        }
        if (max !== undefined && max > MAX_AMOUNT) {
                errors.push(VALIDATION_MESSAGES.AMOUNT_TOO_LARGE);
        }
        return { isValid: errors.length === 0, errors };
};

/**
 * 最小値・最大値を自動的に補正
 */
const autoCorrectRange = (min?: number, max?: number) => {
        if (min !== undefined && max !== undefined && min > max) {
                return { min: max, max: min };
        }
        return { min, max };
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
                autoCorrect = false,
        }) => {
                const [validation, setValidation] =
                        React.useState<ValidationResult>({
                                isValid: true,
                                errors: [],
                        });

                const handleMinAmountChange = (
                        e: React.ChangeEvent<HTMLInputElement>,
                ) => {
                        const value = e.target.value;
                        const num = value === "" ? undefined : Number(value);
                        let newMin = num;
                        let newMax = maxAmount;

                        if (autoCorrect) {
                                ({ min: newMin, max: newMax } =
                                        autoCorrectRange(num, maxAmount));
                        }
                        onMinAmountChange(newMin);
                        if (autoCorrect && newMax !== maxAmount) {
                                onMaxAmountChange(newMax);
                        }
                        setValidation(validateAmountRange(newMin, newMax));
                };

                const handleMaxAmountChange = (
                        e: React.ChangeEvent<HTMLInputElement>,
                ) => {
                        const value = e.target.value;
                        const num = value === "" ? undefined : Number(value);
                        let newMin = minAmount;
                        let newMax = num;

                        if (autoCorrect) {
                                ({ min: newMin, max: newMax } =
                                        autoCorrectRange(minAmount, num));
                        }
                        if (autoCorrect && newMin !== minAmount) {
                                onMinAmountChange(newMin);
                        }
                        onMaxAmountChange(newMax);
                        setValidation(validateAmountRange(newMin, newMax));
                };

                React.useEffect(() => {
                        setValidation(validateAmountRange(minAmount, maxAmount));
                }, [minAmount, maxAmount]);

                const containerClass = isMobile
                        ? FILTER_STYLES.FLEX_MOBILE
                        : FILTER_STYLES.FLEX_DESKTOP;

                return (
                        <div className={containerClass}>
                                {/* 最小金額 */}
                                <div className="flex-1">
                                        <label
                                                htmlFor="minAmount"
                                                className={FILTER_STYLES.LABEL}
                                        >
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
                                        />
                                </div>

                                {/* 最大金額 */}
                                <div className="flex-1">
                                        <label
                                                htmlFor="maxAmount"
                                                className={FILTER_STYLES.LABEL}
                                        >
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
                                        />
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

                                {!validation.isValid && (
                                        <div className="text-red-500 text-sm mt-1">
                                                {validation.errors.map((error, index) => (
                                                        <p
                                                                key={index}
                                                                className={
                                                                        FILTER_STYLES.ERROR_MESSAGE
                                                                }
                                                        >
                                                                {error}
                                                        </p>
                                                ))}
                                        </div>
                                )}
                        </div>
                );
        },
);

AmountRangeFilter.displayName = "AmountRangeFilter";

