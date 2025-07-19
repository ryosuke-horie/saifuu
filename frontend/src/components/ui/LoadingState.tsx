import type { FC } from "react";
import { Spinner, type SpinnerProps } from "./Spinner";

export interface LoadingStateProps {
	message?: string;
	size?: SpinnerProps["size"];
	layout?: "inline" | "block" | "fullpage";
	testId?: string;
}

const layoutClasses = {
	inline: "inline-flex items-center space-x-2",
	block: "flex items-center justify-center space-x-2 py-8",
	fullpage:
		"fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center space-x-2",
} as const;

export const LoadingState: FC<LoadingStateProps> = ({
	message = "読み込み中...",
	size = "sm",
	layout = "block",
	testId = "loading-state",
}) => {
	const layoutClass = layoutClasses[layout];

	return (
		<div className={layoutClass} data-testid={testId}>
			<Spinner size={size} />
			<span className="text-gray-600">{message}</span>
		</div>
	);
};
