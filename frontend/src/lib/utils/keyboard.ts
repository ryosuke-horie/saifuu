/**
 * キーボードナビゲーション関連のユーティリティ関数
 *
 * 設計方針:
 * - フォーカス管理の共通ロジックを集約
 * - アクセシビリティベストプラクティスに準拠
 * - 再利用可能でテスト可能な実装
 * - Matt Pocock型定義パターンの採用
 */

// フォーカス可能な要素のセレクター定数
const FOCUSABLE_SELECTORS = [
	"button:not([disabled])",
	"[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]',
] as const;

/**
 * フォーカス可能な要素を取得する関数
 *
 * @param container - 検索対象のコンテナ要素
 * @returns フォーカス可能な要素の配列
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
	const selector = FOCUSABLE_SELECTORS.join(", ");
	const elements = container.querySelectorAll<HTMLElement>(selector);

	return Array.from(elements).filter((element) => {
		// 非表示の要素は除外
		const style = getComputedStyle(element);
		return style.display !== "none" && style.visibility !== "hidden";
	});
};

/**
 * フォーカストラップのためのTabキーハンドリング
 *
 * @param event - キーボードイベント
 * @param container - フォーカストラップを適用するコンテナ
 * @returns キーイベントが処理されたかどうか
 */
export const handleFocusTrap = (
	event: React.KeyboardEvent<HTMLElement>,
	container: HTMLElement,
): boolean => {
	if (event.key !== "Tab") {
		return false;
	}

	const focusableElements = getFocusableElements(container);

	if (focusableElements.length === 0) {
		// フォーカス可能な要素がない場合は、デフォルト動作を防ぐ
		event.preventDefault();
		return true;
	}

	const currentIndex = focusableElements.indexOf(
		document.activeElement as HTMLElement,
	);

	if (event.shiftKey) {
		// Shift+Tab (逆方向)
		event.preventDefault();
		if (currentIndex <= 0) {
			// 最初の要素または見つからない場合は最後の要素にフォーカス
			focusableElements[focusableElements.length - 1]?.focus();
		} else {
			// 前の要素にフォーカス
			focusableElements[currentIndex - 1]?.focus();
		}
	} else {
		// Tab (順方向)
		event.preventDefault();
		if (currentIndex < 0 || currentIndex >= focusableElements.length - 1) {
			// 見つからないか最後の要素の場合は最初の要素にフォーカス
			focusableElements[0]?.focus();
		} else {
			// 次の要素にフォーカス
			focusableElements[currentIndex + 1]?.focus();
		}
	}

	return true;
};

/**
 * 入力フィールドにフォーカスがあるかどうかを判定
 * キーボードショートカットの無効化に使用
 *
 * @returns 入力フィールドにフォーカスがあるかどうか
 */
export const isInputFocused = (): boolean => {
	const activeElement = document.activeElement;

	return (
		activeElement instanceof HTMLInputElement ||
		activeElement instanceof HTMLTextAreaElement ||
		activeElement instanceof HTMLSelectElement ||
		(activeElement as HTMLElement)?.contentEditable === "true"
	);
};

/**
 * キーボードショートカットの判定に使用する修飾キーの判定
 * Mac: metaKey, Windows/Linux: ctrlKey
 *
 * @param event - キーボードイベント
 * @returns 修飾キーが押されているかどうか
 */
export const isModifierPressed = (
	event: KeyboardEvent | React.KeyboardEvent,
): boolean => {
	return event.metaKey || event.ctrlKey;
};

/**
 * フォーカス可能要素のセレクター型（リテラル型による型安全性確保）
 */
type FocusableSelector = (typeof FOCUSABLE_SELECTORS)[number];

/**
 * キーボードイベントの型ガード
 * React.KeyboardEventとnative KeyboardEventの両方に対応
 */
export const isKeyboardEvent = (
	event: Event | React.KeyboardEvent,
): event is KeyboardEvent | React.KeyboardEvent => {
	return "key" in event;
};

/**
 * HTMLElementのフォーカス可能性を判定する型ガード
 */
export const isFocusableElement = (
	element: Element,
): element is HTMLElement => {
	return element instanceof HTMLElement;
};

// 型エクスポート
export type { FocusableSelector };
