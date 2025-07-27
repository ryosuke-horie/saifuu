import type { FC } from "react";

/**
 * 共通フォームコンポーネント
 *
 * フォーム全体で再利用可能なUIコンポーネント群
 */

// 共通のフィールドスタイルを返すヘルパー関数
export const getFieldClassName = (hasError: boolean, disabled = false) => `
	block w-full px-3 py-2 border rounded-md shadow-sm
	focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
	${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
	${hasError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
`;

// エラーメッセージコンポーネント
export const ErrorMessage: FC<{ error?: string; id: string }> = ({
	error,
	id,
}) => {
	if (!error) return null;
	return (
		<p id={id} className="mt-1 text-sm text-red-600" role="alert">
			{error}
		</p>
	);
};

// ラベルコンポーネント
export const FormLabel: FC<{
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
export const PrimaryButton: FC<{
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
export const SecondaryButton: FC<{
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
