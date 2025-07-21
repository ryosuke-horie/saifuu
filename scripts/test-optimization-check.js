#!/usr/bin/env node

/**
 * テスト最適化の効果を検証するスクリプト
 * 
 * Issue #310: 中規模コンポーネントの最適化による効果を測定
 */

const fs = require('fs');
const path = require('path');

// テスト最適化の目標値
const OPTIMIZATION_TARGETS = {
  'SubscriptionForm': {
    testPath: 'frontend/src/components/subscriptions/SubscriptionForm.test.tsx',
    sourcePath: 'frontend/src/components/subscriptions/SubscriptionForm.tsx',
    currentRatio: 2.85,
    targetRatio: 2.0,
    targetReduction: 114
  },
  'ExpenseForm': {
    testPath: 'frontend/src/components/expenses/ExpenseForm.test.tsx',
    sourcePath: 'frontend/src/components/expenses/ExpenseForm.tsx',
    currentRatio: 2.60,
    targetRatio: 2.0,
    targetReduction: 83
  },
  'Header': {
    testPath: 'frontend/src/components/layout/Header.test.tsx',
    sourcePath: 'frontend/src/components/layout/Header.tsx',
    currentRatio: 3.15,
    targetRatio: 2.0,
    targetReduction: 145
  }
};

// ファイルの行数をカウント
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

// テスト最適化のチェック
function checkOptimizationStatus() {
  console.log('=== テスト最適化ステータスチェック (Issue #310) ===\n');
  
  let allPassed = true;
  const results = [];
  
  for (const [componentName, target] of Object.entries(OPTIMIZATION_TARGETS)) {
    const testLines = countLines(target.testPath);
    const sourceLines = countLines(target.sourcePath);
    const actualRatio = sourceLines > 0 ? (testLines / sourceLines).toFixed(2) : 0;
    const passed = actualRatio <= target.targetRatio;
    
    if (!passed) allPassed = false;
    
    results.push({
      component: componentName,
      sourceLines,
      testLines,
      actualRatio: parseFloat(actualRatio),
      targetRatio: target.targetRatio,
      passed,
      reductionNeeded: Math.max(0, testLines - (sourceLines * target.targetRatio))
    });
  }
  
  // 結果の表示
  console.log('📊 コンポーネント別状況:');
  console.log('\u2550'.repeat(70));
  console.log('コンポーネント    | ソース | テスト | 比率  | 目標 | 状態 | 削減必要');
  console.log('\u2550'.repeat(70));
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(
      `${result.component.padEnd(15)} | ` +
      `${result.sourceLines.toString().padStart(5)} | ` +
      `${result.testLines.toString().padStart(5)} | ` +
      `${result.actualRatio.toFixed(2).padStart(5)}x | ` +
      `${result.targetRatio.toFixed(1).padStart(4)}x | ` +
      `${status} | ` +
      `${result.reductionNeeded > 0 ? result.reductionNeeded + '行' : '-'}`
    );
  });
  
  console.log('\u2550'.repeat(70));
  
  // 必須テストの確認
  console.log('\n🔍 必須テストケースの確認:');
  const requiredTests = [
    { file: 'SubscriptionForm', patterns: ['サービス名が空', '料金が0以下', '次回請求日が空'] },
    { file: 'ExpenseForm', patterns: ['金額が空', '日付が空'] },
    { file: 'Header', patterns: ['カスタムタイトル', 'アクセシビリティ'] }
  ];
  
  requiredTests.forEach(({ file, patterns }) => {
    const target = OPTIMIZATION_TARGETS[file];
    if (!target) return;
    
    try {
      const content = fs.readFileSync(target.testPath, 'utf8');
      const missingTests = patterns.filter(pattern => !content.includes(pattern));
      
      if (missingTests.length === 0) {
        console.log(`  ${file}: ✅ すべての必須テストが存在`);
      } else {
        console.log(`  ${file}: ⚠️  不足: ${missingTests.join(', ')}`);
      }
    } catch (error) {
      console.log(`  ${file}: ❌ ファイル読み込みエラー`);
    }
  });
  
  // 結果サマリ
  console.log('\n🎯 最適化ステータス:');
  if (allPassed) {
    console.log('  ✅ すべてのコンポーネントが目標比率を達成しています！');
  } else {
    const needsWork = results.filter(r => !r.passed);
    console.log(`  ❌ ${needsWork.length}件のコンポーネントが最適化必要`);
    console.log(`  📝 合計${needsWork.reduce((sum, r) => sum + r.reductionNeeded, 0)}行のテストコード削減が必要`);
  }
  
  return allPassed;
}

// メイン実行
if (require.main === module) {
  const passed = checkOptimizationStatus();
  process.exit(passed ? 0 : 1);
}

module.exports = { checkOptimizationStatus };