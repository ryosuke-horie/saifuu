/**
 * Paginationコンポーネント
 *
 * ページネーション機能を提供するUIコンポーネント
 * - ページ番号表示とナビゲーション
 * - 表示件数の選択
 * - アクセシビリティ対応
 * - モバイル対応（簡略表示）
 */

import type { FC } from "react";
import { useMemo } from "react";
import {
	ITEMS_PER_PAGE_OPTIONS,
	PAGINATION_CONFIG,
} from "../../constants/pagination";
import { PAGINATION_STYLES } from "../../styles/pagination";
import type { PaginationProps } from "../../types/pagination";
import { generatePageNumbers } from "../../utils/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

/**
 * ページネーションコンポーネント
 *
 * Matt Pocock氏の型定義方針に準拠:
 * - propsの型はimportした型定義を使用
 * - 内部の計算はuseMemoで最適化
 * - satisfiesで型推論を維持
 */
export const Pagination: FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	isMobile = false,
}) => {
	// ページ番号の配列を生成（メモ化で最適化）
	// フックはコンポーネントのトップレベルで実行する必要がある
	const pageNumbers = useMemo(
		() =>
			generatePageNumbers({
				currentPage,
				totalPages,
				isMobile,
			}),
		[currentPage, totalPages, isMobile],
	);

	// 表示件数オプションの生成（メモ化）
	const itemsPerPageOptions = useMemo(
		() =>
			ITEMS_PER_PAGE_OPTIONS.map((value) => ({
				value,
				label: `${value}件`,
			})),
		[],
	);

	// データがない場合は非表示
	if (totalItems === 0 || totalPages === 0) {
		return null;
	}

	return (
		<nav aria-label="ページネーション" className={PAGINATION_STYLES.CONTAINER}>
			{/* ページ情報 */}
			<div className={PAGINATION_STYLES.INFO_SECTION}>
				<span className={PAGINATION_STYLES.INFO_TEXT}>
					{currentPage} / {totalPages}
				</span>
				<span className={PAGINATION_STYLES.TOTAL_TEXT}>全{totalItems}件</span>
			</div>

			{/* ナビゲーションコントロール */}
			<div className={PAGINATION_STYLES.NAV_SECTION}>
				{/* 前へボタン */}
				<button
					type="button"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					aria-label="前のページ"
					className={PAGINATION_STYLES.NAV_BUTTON}
				>
					<ChevronLeftIcon
						className={PAGINATION_STYLES.ICON}
						aria-hidden="true"
					/>
				</button>

				{/* ページ番号ボタン（デスクトップのみ） */}
				{!isMobile && (
					<div className={PAGINATION_STYLES.PAGE_BUTTONS}>
						{pageNumbers.map((pageNumber, index) => {
							if (pageNumber === PAGINATION_CONFIG.ELLIPSIS) {
								// 省略記号の位置を一意に識別するため、前後のページ番号を使用
								const prevPage = index > 0 ? pageNumbers[index - 1] : "start";
								const nextPage =
									index < pageNumbers.length - 1
										? pageNumbers[index + 1]
										: "end";
								return (
									<span
										key={`ellipsis-${prevPage}-${nextPage}`}
										className={PAGINATION_STYLES.ELLIPSIS}
									>
										{PAGINATION_CONFIG.ELLIPSIS}
									</span>
								);
							}

							const isCurrentPage = pageNumber === currentPage;
							return (
								<button
									key={pageNumber}
									type="button"
									onClick={() => onPageChange(pageNumber as number)}
									aria-label={`${pageNumber}ページ目へ`}
									aria-current={isCurrentPage ? "page" : undefined}
									className={
										isCurrentPage
											? PAGINATION_STYLES.PAGE_BUTTON_ACTIVE
											: PAGINATION_STYLES.PAGE_BUTTON
									}
								>
									{pageNumber}
								</button>
							);
						})}
					</div>
				)}

				{/* 次へボタン */}
				<button
					type="button"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					aria-label="次のページ"
					className={PAGINATION_STYLES.NAV_BUTTON}
				>
					<ChevronRightIcon
						className={PAGINATION_STYLES.ICON}
						aria-hidden="true"
					/>
				</button>

				{/* 表示件数セレクタ */}
				<div className={PAGINATION_STYLES.SELECT_CONTAINER}>
					<label htmlFor="items-per-page" className="sr-only">
						表示件数
					</label>
					<select
						id="items-per-page"
						value={itemsPerPage}
						onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
						aria-label="表示件数"
						className={PAGINATION_STYLES.SELECT}
					>
						{itemsPerPageOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			</div>
		</nav>
	);
};

// Re-export types for backward compatibility
export type { PaginationProps } from "../../types/pagination";
