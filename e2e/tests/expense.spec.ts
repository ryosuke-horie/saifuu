import { test, expect } from '@playwright/test';

test.describe('支出管理機能', () => {
  test('支出の登録・編集・削除が正常に動作すること', async ({ page }) => {
    // タイムスタンプを使って一意なテストデータを作成
    const timestamp = Date.now();
    const testDescription = `[E2E_TEST] 動作確認 ${timestamp}`;
    const editedDescription = `[E2E_TEST] 編集確認 ${timestamp}`;
    
    // ホーム画面から支出管理画面へ遷移
    await page.goto('/');
    // ダッシュボードのナビゲーションカードをクリック（ヘッダーのリンクではなく）
    await page.getByRole('link', { name: '💸 支出管理 支出の記録と管理' }).click();
    
    // 支出管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/expenses/);
    
    // 新規支出を登録
    await page.getByRole('button', { name: '新しい支出を登録' }).click();
    
    // フォームに入力（一意なデータ）
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('152000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-21');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(testDescription);
    await page.getByLabel('カテゴリ').selectOption('1'); // 食費カテゴリ
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // フォームが閉じることを確認（モーダルやフォームが消えるのを待つ）
    await expect(page.getByRole('button', { name: '登録', exact: true })).not.toBeVisible();
    
    // 登録した支出が一覧に表示されることを確認
    // 一意なテストデータを使って確実に特定
    const newRow = page.locator('tr', { hasText: testDescription });
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('text=/152[,，]000/')).toBeVisible();
    
    // 編集機能のテスト
    // 最後に追加した行の編集ボタンをクリック
    await newRow.getByRole('button', { name: '編集' }).click();
    
    // フォームの値を更新
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(editedDescription);
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('142000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-22');
    
    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click();
    
    // フォームが閉じることを確認
    await expect(page.getByRole('button', { name: '更新' })).not.toBeVisible();
    
    // 更新された内容が表示されることを確認
    const updatedRow = page.locator('tr', { hasText: editedDescription });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.locator('text=/142[,，]000/')).toBeVisible();
    
    // 削除機能のテスト
    // 更新した行の削除ボタンをクリック
    await updatedRow.getByRole('button', { name: '削除' }).click();
    
    // 確認ダイアログで削除を実行
    await page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
    
    // 削除されたことを確認（その行が存在しないこと）
    await expect(page.locator('tr', { hasText: editedDescription })).not.toBeVisible();
  });
});