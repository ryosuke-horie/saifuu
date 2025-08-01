import { useCallback, useEffect } from "react";
import { isInputFocused, isModifierPressed } from "../lib/utils/keyboard";

/**
 * グローバルキーボードショートカットを管理するカスタムフック
 *
 * Issue #250: キーボードナビゲーションの改善
 * - Cmd+N（Mac）/Ctrl+N（Windows）: 新規作成
 * - Cmd+K（Mac）/Ctrl+K（Windows）: 検索
 * - Cmd+S（Mac）/Ctrl+S（Windows）: 保存
 * - Escape: キャンセル
 * - ?: ヘルプ
 *
 * 設計方針:
 * - 入力フィールドにフォーカスがある場合はショートカットを無効化
 * - デフォルトのブラウザ動作を防ぐ
 * - クロスプラットフォーム対応
 */

export interface UseKeyboardShortcutsOptions {
	/** 新規作成のコールバック */
	onNewItem?: () => void;
	/** 検索のコールバック */
	onSearch?: () => void;
	/** 保存のコールバック */
	onSave?: () => void;
	/** キャンセルのコールバック */
	onCancel?: () => void;
	/** ヘルプのコールバック */
	onHelp?: () => void;
	/** ショートカットを有効にするかどうか（デフォルト: true） */
	enabled?: boolean;
}

export const useKeyboardShortcuts = (
	options: UseKeyboardShortcutsOptions = {},
) => {
	const {
		onNewItem,
		onSearch,
		onSave,
		onCancel,
		onHelp,
		enabled = true,
	} = options;

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			// 無効化されている場合は何もしない
			if (!enabled) {
				return;
			}

			// 入力フィールドにフォーカスがある場合はショートカットを無効化（Escapeキー以外）
			if (isInputFocused() && event.key !== "Escape") {
				return;
			}

			// Mac: metaKey, Windows/Linux: ctrlKey
			const modifierPressed = isModifierPressed(event);

			// Cmd/Ctrl+N: 新規作成
			if (modifierPressed && event.key === "n" && onNewItem) {
				event.preventDefault();
				onNewItem();
				return;
			}

			// Cmd/Ctrl+K: 検索
			if (modifierPressed && event.key === "k" && onSearch) {
				event.preventDefault();
				onSearch();
				return;
			}

			// Cmd/Ctrl+S: 保存
			if (modifierPressed && event.key === "s" && onSave) {
				event.preventDefault();
				onSave();
				return;
			}

			// Escape: キャンセル
			if (event.key === "Escape" && onCancel) {
				onCancel();
				return;
			}

			// ?: ヘルプ（Shift+/）
			if (event.key === "?" && event.shiftKey && onHelp) {
				event.preventDefault();
				onHelp();
				return;
			}
		},
		[enabled, onNewItem, onSearch, onSave, onCancel, onHelp],
	);

	useEffect(() => {
		// イベントリスナーを登録
		document.addEventListener("keydown", handleKeyDown);

		// クリーンアップ
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
};
