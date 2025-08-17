import { test, expect } from '@playwright/test';

test.describe('支出管理機能', () => {
  test('支出の登録・編集・削除が正常に動作すること', async ({ page, browserName }) => {
    // コンソールログを出力
    page.on('console', msg => console.log('Browser Console:', msg.text()));
    page.on('pageerror', error => console.log('Browser Error:', error.message));
    
    // タイムスタンプとブラウザ名を使って一意なテストデータを作成
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testDescription = `[E2E_TEST] 動作確認 ${timestamp}_${randomId}`;
    const editedDescription = `[E2E_TEST] 編集確認 ${timestamp}_${randomId}`;
    
    // 支出管理画面へ直接遷移
    await page.goto('/expenses');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');
    
    // 支出管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/expenses/);
    
    // ページが正しく読み込まれたことを確認（h1要素で確認）
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // 新規登録ボタンをクリック
    await page.click('button:has-text("新規登録")');
    
    // ダイアログが開くまで待機
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // フォームに入力（一意なデータ）
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('152000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-21');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(testDescription);
    await page.getByLabel('カテゴリ').selectOption('1'); // 食費カテゴリ
    
    // 登録ボタンをクリック（フォームが有効になるまで待機）
    const submitButton = page.getByRole('button', { name: '登録', exact: true });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    
    // API呼び出しを監視
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/transactions'), { timeout: 10000 }),
      submitButton.click()
    ]);
    
    console.log('API Response Status:', response.status());
    console.log('API Response URL:', response.url());
    
    // API応答を待つ
    await page.waitForTimeout(1000);
    
    // フォームが閉じることを確認（ダイアログが消えるのを待つ）
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    
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
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
    
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