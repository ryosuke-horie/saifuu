#!/usr/bin/env node

/**
 * テストコードとソースコードの比率を監視するスクリプト
 * 
 * このスクリプトは、コンポーネント別にテストコードの行数とソースコードの行数を比較し、
 * オーバーテストを防止するための基準に照らし合わせて警告を出力します。
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const {
  countLines,
  getComponentCategory,
  findSourceFile,
  calculateRatio,
  formatViolation,
  RATIO_LIMITS
} = require('./lib/test-analysis');

// テストファイルパターン
const TEST_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.stories.tsx'  // Storybookもテストの一部として含める
];

// 除外パターン
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/storybook-static/**'
];

/**
 * プロジェクト全体のテスト比率を分析
 */
function analyzeTestRatios(rootDir) {
  const results = {
    totalSourceLines: 0,
    totalTestLines: 0,
    violations: [],
    warnings: [],
    summary: []
  };

  // テストファイルを検索
  const testFiles = [];
  TEST_PATTERNS.forEach(pattern => {
    const files = glob.sync(path.join(rootDir, pattern), {
      ignore: EXCLUDE_PATTERNS.map(p => path.join(rootDir, p))
    });
    testFiles.push(...files);
  });

  // 処理済みのソースファイルを追跡
  const processedSources = new Set();

  testFiles.forEach(testFile => {
    const sourceFile = findSourceFile(testFile);
    
    if (!sourceFile || processedSources.has(sourceFile)) {
      return;
    }
    
    processedSources.add(sourceFile);
    
    const testLines = countLines(testFile);
    const sourceLines = countLines(sourceFile);
    
    if (sourceLines === 0) return;
    
    const ratio = calculateRatio(testLines, sourceLines);
    const category = getComponentCategory(sourceLines);
    const limit = RATIO_LIMITS[category].ratio;
    
    results.totalSourceLines += sourceLines;
    results.totalTestLines += testLines;
    
    const fileInfo = {
      source: path.relative(rootDir, sourceFile),
      test: path.relative(rootDir, testFile),
      sourceLines,
      testLines,
      ratio: ratio.toFixed(2),
      category,
      limit
    };
    
    if (ratio > limit) {
      results.violations.push(formatViolation(fileInfo));
    } else if (ratio > limit * 0.9) {
      results.warnings.push(fileInfo);
    }
    
    results.summary.push(fileInfo);
  });

  return results;
}

/**
 * 結果をフォーマットして出力
 */
function reportResults(results) {
  console.log('\n=== テストコード比率監視レポート ===\n');
  
  // 全体サマリー
  const overallRatio = results.totalTestLines / results.totalSourceLines;
  console.log(`📊 全体統計`);
  console.log(`  - ソースコード総行数: ${results.totalSourceLines.toLocaleString()}`);
  console.log(`  - テストコード総行数: ${results.totalTestLines.toLocaleString()}`);
  console.log(`  - 全体比率: ${overallRatio.toFixed(2)}x\n`);
  
  // 基準違反
  if (results.violations.length > 0) {
    console.log(`❌ 基準違反ファイル (${results.violations.length}件):`);
    results.violations.forEach(v => {
      console.log(`  - ${v.source}`);
      console.log(`    サイズ: ${v.category} (${v.sourceLines}行), 比率: ${v.ratio}x (上限: ${v.limit}x)`);
      console.log(`    超過行数: ${v.excess}行\n`);
    });
  }
  
  // 警告
  if (results.warnings.length > 0) {
    console.log(`⚠️  警告ファイル (${results.warnings.length}件):`);
    results.warnings.forEach(w => {
      console.log(`  - ${w.source}`);
      console.log(`    サイズ: ${w.category} (${w.sourceLines}行), 比率: ${w.ratio}x (上限: ${w.limit}x)\n`);
    });
  }
  
  // 推奨事項
  if (results.violations.length > 0 || results.warnings.length > 0) {
    console.log('💡 推奨事項:');
    console.log('  1. 実装の詳細に依存したテストを削除');
    console.log('  2. 重複したテストケースを統合');
    console.log('  3. Storybookでカバーされている視覚的テストを削除');
    console.log('  4. エッジケースと異常系に注力し、正常系は最小限に\n');
  } else {
    console.log('✅ すべてのファイルが基準内です！\n');
  }
  
  // 詳細レポートの保存
  const reportPath = path.join(process.cwd(), 'test-ratio-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 詳細レポートを保存しました: ${reportPath}`);
  
  // CI環境で基準違反がある場合はエラーコードで終了
  if (process.env.CI && results.violations.length > 0) {
    process.exit(1);
  }
}

// メイン処理
function main() {
  const rootDir = process.cwd();
  
  console.log('🔍 テストコード比率を分析中...\n');
  
  // frontendとapiディレクトリを個別に分析
  const frontendResults = analyzeTestRatios(path.join(rootDir, 'frontend'));
  const apiResults = analyzeTestRatios(path.join(rootDir, 'api'));
  
  // 結果を統合
  const combinedResults = {
    totalSourceLines: frontendResults.totalSourceLines + apiResults.totalSourceLines,
    totalTestLines: frontendResults.totalTestLines + apiResults.totalTestLines,
    violations: [...frontendResults.violations, ...apiResults.violations],
    warnings: [...frontendResults.warnings, ...apiResults.warnings],
    summary: [...frontendResults.summary, ...apiResults.summary]
  };
  
  reportResults(combinedResults);
}

// globパッケージが必要
try {
  require('glob');
} catch (e) {
  console.error('❌ エラー: globパッケージが見つかりません');
  console.error('以下のコマンドでインストールしてください:');
  console.error('  npm install --save-dev glob');
  process.exit(1);
}

main();