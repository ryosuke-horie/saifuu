import { test, expect } from '@playwright/test';

test.describe('収入管理機能', () => {
  test('収入の登録・編集・削除が正常に動作すること', async ({ page }) => {
    // タイムスタンプを使って一意なテストデータを作成
    const timestamp = Date.now();
    const testDescription = `[E2E_TEST] 収入動作確認 ${timestamp}`;
    const editedDescription = `[E2E_TEST] 収入編集確認 ${timestamp}`;
    
    // ホーム画面から収入管理画面へ遷移
    await page.goto('/');
    // ダッシュボードのナビゲーションカードをクリック（data-testidを使用）
    await page.getByTestId('navigation-income').click();
    
    // 収入管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/income/);
    
    // フォームに入力（一意なデータ）
    // 収入管理画面ではフォームが常に表示されている
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('300000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-21');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(testDescription);
    await page.getByLabel('カテゴリ').selectOption('101'); // 給与カテゴリ
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // 登録後、フォームがクリアされるのを待つ
    await page.waitForTimeout(500);
    
    // 登録した収入が一覧に表示されることを確認
    // 一意なテストデータを使って確実に特定
    const newRow = page.locator('tr', { hasText: testDescription });
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('text=/300[,，]000/')).toBeVisible();
    
    // 編集機能のテスト
    // 最後に追加した行の編集ボタンをクリック
    await newRow.getByRole('button', { name: '編集' }).click();
    
    // フォームの値を更新
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(editedDescription);
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('280000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-22');
    
    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click();
    
    // 更新後、フォームがクリアされるのを待つ
    await page.waitForTimeout(500);
    
    // 更新された内容が表示されることを確認
    const updatedRow = page.locator('tr', { hasText: editedDescription });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.locator('text=/280[,，]000/')).toBeVisible();
    
    // 削除機能のテスト
    // 更新した行の削除ボタンをクリック
    await updatedRow.getByRole('button', { name: '削除' }).click();
    
    // 確認ダイアログで削除を実行
    await page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
    
    // 削除されたことを確認（その行が存在しないこと）
    await expect(page.locator('tr', { hasText: editedDescription })).not.toBeVisible();
  });

  test('収入カテゴリでフィルタリングが正常に動作すること', async ({ page }) => {
    // タイムスタンプを使って一意なテストデータを作成
    const timestamp = Date.now();
    const salaryDesc = `[E2E_TEST] 給与 ${timestamp}`;
    const bonusDesc = `[E2E_TEST] ボーナス ${timestamp}`;
    const sideDesc = `[E2E_TEST] 副業 ${timestamp}`;
    
    // 収入管理画面へ遷移
    await page.goto('/income');
    
    // 複数の収入を登録
    // 1. 給与
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('300000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-01');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(salaryDesc);
    await page.getByLabel('カテゴリ').selectOption('101'); // 給与
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // 登録後、フォームがクリアされるのを待つ
    await page.waitForTimeout(500);
    
    // 2. ボーナス
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('100000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-10');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(bonusDesc);
    await page.getByLabel('カテゴリ').selectOption('102'); // ボーナス
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // 登録後、フォームがクリアされるのを待つ
    await page.waitForTimeout(500);
    
    // 3. 副業
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('50000');
    await page.getByRole('textbox', { name: '日付 *' }).fill('2025-07-15');
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(sideDesc);
    await page.getByLabel('カテゴリ').selectOption('103'); // 副業
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // 登録後、フォームがクリアされるのを待つ
    await page.waitForTimeout(500);
    
    // すべての収入が表示されることを確認
    await expect(page.locator('tr', { hasText: salaryDesc })).toBeVisible();
    await expect(page.locator('tr', { hasText: bonusDesc })).toBeVisible();
    await expect(page.locator('tr', { hasText: sideDesc })).toBeVisible();
    
    // カテゴリフィルタで「給与」を選択
    await page.getByLabel('カテゴリフィルタ').selectOption('101');
    
    // 給与のみが表示されることを確認
    await expect(page.locator('tr', { hasText: salaryDesc })).toBeVisible();
    await expect(page.locator('tr', { hasText: bonusDesc })).not.toBeVisible();
    await expect(page.locator('tr', { hasText: sideDesc })).not.toBeVisible();
    
    // フィルタをリセット
    await page.getByLabel('カテゴリフィルタ').selectOption('all');
    
    // すべての収入が再度表示されることを確認
    await expect(page.locator('tr', { hasText: salaryDesc })).toBeVisible();
    await expect(page.locator('tr', { hasText: bonusDesc })).toBeVisible();
    await expect(page.locator('tr', { hasText: sideDesc })).toBeVisible();
    
    // テストデータを削除（クリーンアップ）
    const rows = [salaryDesc, bonusDesc, sideDesc];
    for (const desc of rows) {
      const row = page.locator('tr', { hasText: desc });
      await row.getByRole('button', { name: '削除' }).click();
      await page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
      await expect(row).not.toBeVisible();
    }
  });
});