type ExportButtonProps = {
	onClick: () => void;
	isExporting: boolean;
};

/**
 * CSVエクスポートボタンコンポーネント
 * レポートデータをCSV形式でダウンロード
 */
export function ExportButton({ onClick, isExporting }: ExportButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={isExporting}
			className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{isExporting ? "エクスポート中..." : "CSVエクスポート"}
		</button>
	);
}
