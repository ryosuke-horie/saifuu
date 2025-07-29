/**
 * エラーセクションコンポーネント
 *
 * 複数のエラーを統合して表示する
 */

import { ErrorAlert } from "../ui/ErrorAlert";

interface ErrorSectionProps {
	/** エラーメッセージの配列 */
	errors: Array<{
		key: string;
		message: string;
	}>;
	/** 追加のCSSクラス */
	className?: string;
}

export const ErrorSection = ({ errors, className = "" }: ErrorSectionProps) => {
	if (errors.length === 0) {
		return null;
	}

	return (
		<div className={className}>
			{errors.map((error) => (
				<ErrorAlert key={error.key} message={error.message} className="mb-4" />
			))}
		</div>
	);
};
