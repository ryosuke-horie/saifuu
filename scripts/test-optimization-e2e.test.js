/**
 * テスト最適化の効果を検証するE2Eテスト
 * 
 * Issue #310: 中規模コンポーネントの最適化による効果を測定
 * - テストコード比率の改善
 * - テスト実行時間の短縮
 */

import { test, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// テスト最適化の目標値
const OPTIMIZATION_TARGETS = {
  subscriptionForm: {
    currentRatio: 2.85,
    targetRatio: 2.0,
    currentLines: 382, // 134 * 2.85
    targetReduction: 114 // 削減目標行数
  },
  expenseForm: {
    currentRatio: 2.60,
    targetRatio: 2.0,
    targetReduction: 83
  },
  header: {
    currentRatio: 3.15,
    targetRatio: 2.0,
    currentLines: 397, // 126 * 3.15
    targetReduction: 145
  }
};

test('SubscriptionFormのテストコード比率が目標値以下になること', () => {
  const testFile = path.join(__dirname, '../frontend/src/components/subscriptions/SubscriptionForm.test.tsx');
  const sourceFile = path.join(__dirname, '../frontend/src/components/subscriptions/SubscriptionForm.tsx');
  
  const testContent = fs.readFileSync(testFile, 'utf8');
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  
  const testLines = testContent.split('\n').length;
  const sourceLines = sourceContent.split('\n').length;
  const ratio = testLines / sourceLines;
  
  // 現在は失敗する（比率が高い）
  expect(ratio).toBeLessThanOrEqual(OPTIMIZATION_TARGETS.subscriptionForm.targetRatio);
});

test('Headerコンポーネントのテストコード比率が目標値以下になること', () => {
  const testFile = path.join(__dirname, '../frontend/src/components/layout/Header.test.tsx');
  const sourceFile = path.join(__dirname, '../frontend/src/components/layout/Header.tsx');
  
  const testContent = fs.readFileSync(testFile, 'utf8');
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  
  const testLines = testContent.split('\n').length;
  const sourceLines = sourceContent.split('\n').length;
  const ratio = testLines / sourceLines;
  
  // 現在は失敗する（比率が高い）
  expect(ratio).toBeLessThanOrEqual(OPTIMIZATION_TARGETS.header.targetRatio);
});

test('フロントエンドテストの実行時間が60秒以内であること', async () => {
  const startTime = Date.now();
  
  try {
    // フロントエンドのテストを実行
    execSync('cd frontend && npm run test:unit', { stdio: 'pipe' });
  } catch (error) {
    // テスト失敗は無視（実行時間のみ測定）
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // 秒単位
  
  // 60秒以内であることを確認
  expect(duration).toBeLessThan(60);
});

test('最適化後も必要なテストカバレッジが維持されること', () => {
  // 重要なバリデーションロジックがテストされていることを確認
  const subscriptionTestContent = fs.readFileSync(
    path.join(__dirname, '../frontend/src/components/subscriptions/SubscriptionForm.test.tsx'),
    'utf8'
  );
  
  // 必須のテストケースが存在することを確認
  const requiredTests = [
    'サービス名が空の場合エラー',
    '料金が0以下の場合エラー',
    '次回請求日が空の場合エラー',
    '有効なデータでフォーム送信が実行される'
  ];
  
  requiredTests.forEach(testName => {
    expect(subscriptionTestContent).toContain(testName);
  });
});