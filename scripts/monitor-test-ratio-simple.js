#!/usr/bin/env node

/**
 * テストコードとソースコードの比率を監視するシンプルなスクリプト
 * 外部依存なしで動作する簡易版
 */

const fs = require('fs');
const path = require('path');

// コンポーネントサイズ別の比率上限
const RATIO_LIMITS = {
  small: { lines: 100, ratio: 1.5 },
  medium: { lines: 300, ratio: 2.0 },
  large: { lines: Infinity, ratio: 2.5 }
};

/**
 * ファイルの行数をカウント
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * コンポーネントのサイズカテゴリを判定
 */
function getComponentCategory(lines) {
  if (lines < RATIO_LIMITS.small.lines) return 'small';
  if (lines < RATIO_LIMITS.medium.lines) return 'medium';
  return 'large';
}

/**
 * ディレクトリを再帰的に走査してファイルを収集
 */
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    
    if (stat.isDirectory()) {
      // 除外ディレクトリをスキップ
      if (['node_modules', 'dist', 'build', 'coverage', '.next', 'storybook-static'].includes(file)) {
        return;
      }
      walkDir(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

/**
 * テストファイルかどうかを判定
 */
function isTestFile(filepath) {
  return /\.(test|spec|stories)\.(ts|tsx)$/.test(filepath);
}

/**
 * テストファイルに対応するソースファイルを見つける
 */
function findSourceFile(testFile) {
  const baseName = testFile
    .replace(/\.(test|spec|stories)\.(ts|tsx)$/, '')
    .replace('/__tests__/', '/');
  
  const extensions = ['.ts', '.tsx'];
  
  for (const ext of extensions) {
    const sourcePath = baseName + ext;
    if (fs.existsSync(sourcePath)) {
      return sourcePath;
    }
  }
  
  return null;
}

/**
 * プロジェクトを分析
 */
function analyzeProject(rootDir) {
  const results = {
    totalSourceLines: 0,
    totalTestLines: 0,
    violations: [],
    warnings: [],
    fileCount: 0
  };
  
  const processedSources = new Set();
  
  // ファイルを収集して分析
  walkDir(rootDir, (filepath) => {
    if (!isTestFile(filepath)) return;
    
    const sourceFile = findSourceFile(filepath);
    if (!sourceFile || processedSources.has(sourceFile)) return;
    
    processedSources.add(sourceFile);
    
    const testLines = countLines(filepath);
    const sourceLines = countLines(sourceFile);
    
    if (sourceLines === 0) return;
    
    const ratio = testLines / sourceLines;
    const category = getComponentCategory(sourceLines);
    const limit = RATIO_LIMITS[category].ratio;
    
    results.totalSourceLines += sourceLines;
    results.totalTestLines += testLines;
    results.fileCount++;
    
    const fileInfo = {
      source: path.relative(rootDir, sourceFile),
      test: path.relative(rootDir, filepath),
      sourceLines,
      testLines,
      ratio: ratio.toFixed(2),
      category,
      limit
    };
    
    if (ratio > limit) {
      results.violations.push({
        ...fileInfo,
        excess: Math.floor((ratio - limit) * sourceLines)
      });
    } else if (ratio > limit * 0.9) {
      results.warnings.push(fileInfo);
    }
  });
  
  return results;
}

/**
 * 結果を表示
 */
function displayResults(results) {
  console.log('\n=== テストコード比率監視レポート ===\n');
  
  if (results.fileCount === 0) {
    console.log('⚠️  分析対象のファイルが見つかりませんでした。');
    return;
  }
  
  // 全体統計
  const overallRatio = results.totalSourceLines > 0 
    ? (results.totalTestLines / results.totalSourceLines).toFixed(2) 
    : 0;
    
  console.log(`📊 全体統計`);
  console.log(`  - 分析ファイル数: ${results.fileCount}`);
  console.log(`  - ソースコード総行数: ${results.totalSourceLines.toLocaleString()}`);
  console.log(`  - テストコード総行数: ${results.totalTestLines.toLocaleString()}`);
  console.log(`  - 全体比率: ${overallRatio}x\n`);
  
  // 基準違反
  if (results.violations.length > 0) {
    console.log(`❌ 基準違反ファイル (${results.violations.length}件):`);
    results.violations.forEach(v => {
      console.log(`\n  ${v.source}`);
      console.log(`    カテゴリ: ${v.category} (${v.sourceLines}行)`);
      console.log(`    比率: ${v.ratio}x (上限: ${v.limit}x)`);
      console.log(`    テスト削減推奨: 約${v.excess}行`);
    });
    console.log('');
  }
  
  // 警告
  if (results.warnings.length > 0) {
    console.log(`⚠️  警告ファイル (${results.warnings.length}件):`);
    results.warnings.forEach(w => {
      console.log(`\n  ${w.source}`);
      console.log(`    カテゴリ: ${w.category} (${w.sourceLines}行)`);
      console.log(`    比率: ${w.ratio}x (上限: ${w.limit}x に接近)`);
    });
    console.log('');
  }
  
  // 推奨事項
  if (results.violations.length > 0 || results.warnings.length > 0) {
    console.log('\n💡 オーバーテスト削減の推奨事項:');
    console.log('  1. 実装の詳細に依存したテストを削除');
    console.log('  2. 重複したテストケースを統合');
    console.log('  3. Storybookでカバーされている視覚的テストを削除');
    console.log('  4. エッジケースと異常系に注力し、正常系は最小限に');
    console.log('  5. 型システムで保証される内容のテストは不要\n');
  } else if (results.fileCount > 0) {
    console.log('✅ すべてのファイルが基準内です！\n');
  }
}

/**
 * メイン処理
 */
function main() {
  const rootDir = process.cwd();
  console.log('🔍 テストコード比率を分析中...\n');
  
  // frontendとapiを個別に分析
  const dirs = ['frontend', 'api'];
  const allResults = {
    totalSourceLines: 0,
    totalTestLines: 0,
    violations: [],
    warnings: [],
    fileCount: 0
  };
  
  dirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📂 ${dir} ディレクトリを分析中...`);
      const results = analyzeProject(fullPath);
      
      allResults.totalSourceLines += results.totalSourceLines;
      allResults.totalTestLines += results.totalTestLines;
      allResults.violations.push(...results.violations);
      allResults.warnings.push(...results.warnings);
      allResults.fileCount += results.fileCount;
    }
  });
  
  displayResults(allResults);
  
  // CI環境で基準違反がある場合はエラーコードで終了
  if (process.env.CI && allResults.violations.length > 0) {
    process.exit(1);
  }
}

main();