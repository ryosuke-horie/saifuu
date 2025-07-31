import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

/**
 * useKeyboardShortcutsフックのテスト
 *
 * Issue #250: キーボードナビゲーションの改善
 * - グローバルショートカットキーの実装
 * - Cmd+N で新規作成
 * - その他のショートカットキー
 */
describe("useKeyboardShortcuts", () => {
	afterEach(() => {
		// イベントリスナーのクリーンアップ
		vi.clearAllMocks();
	});

	it("Cmd+N（Mac）またはCtrl+N（Windows）で新規作成コールバックが呼ばれる", () => {
		const onNewItem = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onNewItem,
			}),
		);

		// Mac用のショートカット
		fireEvent.keyDown(document, { key: "n", metaKey: true });
		expect(onNewItem).toHaveBeenCalledTimes(1);

		// Windows/Linux用のショートカット
		fireEvent.keyDown(document, { key: "n", ctrlKey: true });
		expect(onNewItem).toHaveBeenCalledTimes(2);
	});

	it("Cmd+K（Mac）またはCtrl+K（Windows）で検索コールバックが呼ばれる", () => {
		const onSearch = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onSearch,
			}),
		);

		// Mac用のショートカット
		fireEvent.keyDown(document, { key: "k", metaKey: true });
		expect(onSearch).toHaveBeenCalledTimes(1);

		// デフォルトの動作を防ぐ
		const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
		const preventDefault = vi.spyOn(event, "preventDefault");

		document.dispatchEvent(event);
		expect(preventDefault).toHaveBeenCalled();
	});

	it("Cmd+S（Mac）またはCtrl+S（Windows）で保存コールバックが呼ばれる", () => {
		const onSave = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onSave,
			}),
		);

		// Mac用のショートカット
		fireEvent.keyDown(document, { key: "s", metaKey: true });
		expect(onSave).toHaveBeenCalledTimes(1);

		// デフォルトの動作を防ぐ（ブラウザの保存ダイアログを防ぐ）
		const event = new KeyboardEvent("keydown", { key: "s", metaKey: true });
		const preventDefault = vi.spyOn(event, "preventDefault");

		document.dispatchEvent(event);
		expect(preventDefault).toHaveBeenCalled();
	});

	it("Escapeキーでキャンセルコールバックが呼ばれる", () => {
		const onCancel = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onCancel,
			}),
		);

		fireEvent.keyDown(document, { key: "Escape" });
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("?キーでヘルプコールバックが呼ばれる", () => {
		const onHelp = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onHelp,
			}),
		);

		fireEvent.keyDown(document, { key: "?", shiftKey: true });
		expect(onHelp).toHaveBeenCalledTimes(1);
	});

	it("コールバックが提供されていない場合は何も起こらない", () => {
		// 空のオプションでフックを使用
		renderHook(() => useKeyboardShortcuts({}));

		// ショートカットキーを押してもエラーが発生しない
		expect(() => {
			fireEvent.keyDown(document, { key: "n", metaKey: true });
			fireEvent.keyDown(document, { key: "k", metaKey: true });
			fireEvent.keyDown(document, { key: "s", metaKey: true });
		}).not.toThrow();
	});

	it("enabled=falseの場合、ショートカットが無効になる", () => {
		const onNewItem = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onNewItem,
				enabled: false,
			}),
		);

		fireEvent.keyDown(document, { key: "n", metaKey: true });
		expect(onNewItem).not.toHaveBeenCalled();
	});

	it("入力フィールドにフォーカスがある場合、ショートカットが無効になる", () => {
		const onNewItem = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onNewItem,
			}),
		);

		// input要素を作成してフォーカス
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();

		fireEvent.keyDown(document, { key: "n", metaKey: true });
		expect(onNewItem).not.toHaveBeenCalled();

		// クリーンアップ
		document.body.removeChild(input);
	});

	it("textarea要素にフォーカスがある場合、ショートカットが無効になる", () => {
		const onNewItem = vi.fn();

		renderHook(() =>
			useKeyboardShortcuts({
				onNewItem,
			}),
		);

		// textarea要素を作成してフォーカス
		const textarea = document.createElement("textarea");
		document.body.appendChild(textarea);
		textarea.focus();

		fireEvent.keyDown(document, { key: "n", metaKey: true });
		expect(onNewItem).not.toHaveBeenCalled();

		// クリーンアップ
		document.body.removeChild(textarea);
	});

	it("アンマウント時にイベントリスナーがクリーンアップされる", () => {
		const onNewItem = vi.fn();
		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		const { unmount } = renderHook(() =>
			useKeyboardShortcuts({
				onNewItem,
			}),
		);

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"keydown",
			expect.any(Function),
		);
	});
});
