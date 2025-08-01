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
    
    // カテゴリが読み込まれるまで待つ
    // selectが有効になるまで待機（カテゴリの読み込み完了を意味する）
    const categorySelect = page.getByLabel('カテゴリ');
    await expect(categorySelect).toBeEnabled({ timeout: 5000 });
    
    // 新規収入を登録
    // 支出管理と異なり、収入管理ではフォームが直接表示されている
    
    // フォームに入力（一意なデータ）
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('350000');
    
    // 日付入力: type="date"のinput要素に直接値を設定
    const dateInput = page.locator('#income-date');
    await dateInput.evaluate((el: HTMLInputElement) => {
      el.value = '2025-07-25';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(testDescription);
    
    // カテゴリは任意項目 - 実際の値（value属性）で選択する
    // 収入カテゴリのIDは'101'（給与）、'102'（ボーナス）など（numericIdのstring版）
    const options = await categorySelect.locator('option').count();
    if (options > 1) { // デフォルトの「選択してください」以外のオプションがある場合
      // 給与カテゴリ（numericId: 101）を選択
      await categorySelect.selectOption('101');
    }
    
    // 登録ボタンをクリック
    await page.getByRole('button', { name: '登録', exact: true }).click();
    
    // エラーメッセージが表示されていないか確認
    // role="alert"が複数存在する可能性があるため、より具体的にエラーメッセージのみを取得
    const errorAlert = page.locator('p[role="alert"]').first();
    const errorCount = await errorAlert.count();
    if (errorCount > 0 && await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.error('Form validation error:', errorText);
    }
    
    // 登録処理が完了するまで待つ（一覧に新しい項目が表示されるまで待機）
    await expect(page.locator('tr', { hasText: testDescription })).toBeVisible({ timeout: 10000 });
    
    // 登録した収入が一覧に表示されることを確認
    // 一意なテストデータを使って確実に特定
    const newRow = page.locator('tr', { hasText: testDescription });
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('text=/350[,，]000/')).toBeVisible();
    
    // 編集機能のテスト
    // 最後に追加した行の編集ボタンをクリック
    await newRow.getByRole('button', { name: '編集' }).click();
    
    // フォームの値を更新
    await page.getByRole('textbox', { name: '説明（任意）' }).fill(editedDescription);
    await page.getByRole('spinbutton', { name: '金額（円） *' }).fill('380000');
    
    // 日付更新
    await dateInput.evaluate((el: HTMLInputElement) => {
      el.value = '2025-07-26';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click();
    
    // 更新処理が完了するまで待つ（フォームがクリアされるまで待機）
    await page.waitForTimeout(1000);
    
    // 更新された項目が表示されるまで待機
    await expect(page.locator('tr', { hasText: editedDescription })).toBeVisible({ timeout: 10000 });
    
    // 更新された内容が表示されることを確認
    const updatedRow = page.locator('tr', { hasText: editedDescription });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.locator('text=/380[,，]000/')).toBeVisible();
    
    // 削除機能のテスト
    // 更新した行の削除ボタンをクリック
    await updatedRow.getByRole('button', { name: '削除' }).click();
    
    // 確認ダイアログで削除を実行
    await page.getByRole('dialog').getByRole('button', { name: '削除' }).click();
    
    // 削除されたことを確認（その行が存在しないこと）
    await expect(page.locator('tr', { hasText: editedDescription })).not.toBeVisible();
  });
});