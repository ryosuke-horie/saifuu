import { test, expect } from '@playwright/test';

test.describe('収入管理機能（簡易版）', () => {
  test('収入管理画面にアクセスできること', async ({ page }) => {
    // ホーム画面から収入管理画面へ遷移
    await page.goto('/');
    
    // ナビゲーションカードをクリック
    await page.getByTestId('navigation-income').click();
    
    // 収入管理画面が表示されることを確認
    await expect(page).toHaveURL(/\/income/);
    await expect(page.getByRole('heading', { name: '収入管理' })).toBeVisible();
  });
});