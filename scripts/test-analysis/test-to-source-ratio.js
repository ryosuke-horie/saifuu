#!/usr/bin/env node

/**
 * テストコードとソースコードの比率を分析するスクリプト
 * 
 * 使用方法:
 * node scripts/test-analysis/test-to-source-ratio.js [オプション]
 * 
 * オプション:
 * --project <name>  分析対象プロジェクト (frontend, api, e2e)
 * --verbose         詳細な出力を表示
 * --threshold       警告閾値を超えたファイルのみ表示
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 設定
const CONFIG = {
  projects: {
    frontend: {
      sourcePattern: 'frontend/src/**/*.{ts,tsx}',
      testPattern: 'frontend/src/**/*.{test,spec}.{ts,tsx}',
      excludePatterns: ['**/*.d.ts', '**/node_modules/**', '**/.next/**']
    },
    api: {
      sourcePattern: 'api/src/**/*.ts',
      testPattern: 'api/src/**/*.{test,spec}.ts',
      excludePatterns: ['**/*.d.ts', '**/node_modules/**', '**/dist/**']
    },
    e2e: {
      sourcePattern: 'e2e/**/*.ts',
      testPattern: 'e2e/**/*.{test,spec}.ts',
      excludePatterns: ['**/node_modules/**']
    }
  },
  thresholds: {
    simple: { max: 1.5 },      // シンプルコンポーネント（100行未満）
    medium: { max: 2.0 },      // 中規模コンポーネント（100-400行）
    complex: { max: 2.5 },     // 複雑コンポーネント（400行以上）
    warning: 3.0               // 警告レベル
  }
};

// ユーティリティ関数
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').filter(line => line.trim().length > 0).length;
  } catch (error) {
    console.error(`ファイル読み込みエラー: ${filePath}`);
    return 0;
  }
}

function getComplexityLevel(sourceLines) {
  if (sourceLines < 100) return 'simple';
  if (sourceLines < 400) return 'medium';
  return 'complex';
}

function formatRatio(ratio) {
  return ratio.toFixed(2);
}

function getStatusEmoji(ratio, threshold) {
  if (ratio > CONFIG.thresholds.warning) return '🔴';
  if (ratio > threshold) return '🟡';
  return '🟢';
}

// メイン処理
async function analyzeTestRatio(projectName, options = {}) {
  const project = CONFIG.projects[projectName];
  if (!project) {
    console.error(`不正なプロジェクト名: ${projectName}`);
    console.log('利用可能なプロジェクト:', Object.keys(CONFIG.projects).join(', '));
    process.exit(1);
  }

  console.log(`\n📊 ${projectName.toUpperCase()} プロジェクトのテスト比率分析\n`);

  // ソースファイルとテストファイルを取得
  const sourceFiles = await glob(project.sourcePattern, { 
    ignore: [...project.excludePatterns, project.testPattern]
  });
  
  const testFiles = await glob(project.testPattern, {
    ignore: project.excludePatterns
  });

  // ファイルごとの分析
  const results = [];
  let totalSourceLines = 0;
  let totalTestLines = 0;

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(process.cwd(), sourceFile);
    const testFile = sourceFile.replace(/\.(ts|tsx)$/, '.test.$1');
    const specFile = sourceFile.replace(/\.(ts|tsx)$/, '.spec.$1');
    
    let testFilePath = null;
    if (fs.existsSync(testFile)) {
      testFilePath = testFile;
    } else if (fs.existsSync(specFile)) {
      testFilePath = specFile;
    }

    const sourceLines = countLines(sourceFile);
    const testLines = testFilePath ? countLines(testFilePath) : 0;
    const ratio = testLines > 0 ? testLines / sourceLines : 0;
    const complexityLevel = getComplexityLevel(sourceLines);
    const threshold = CONFIG.thresholds[complexityLevel].max;
    
    totalSourceLines += sourceLines;
    totalTestLines += testLines;

    results.push({
      file: relativePath,
      sourceLines,
      testLines,
      ratio,
      complexityLevel,
      threshold,
      status: getStatusEmoji(ratio, threshold)
    });
  }

  // 結果の表示
  if (options.verbose || options.threshold) {
    console.log('ファイル別分析結果:');
    console.log('─'.repeat(100));
    console.log('状態 | ファイル | ソース行数 | テスト行数 | 比率 | 複雑度 | 閾値');
    console.log('─'.repeat(100));

    const filteredResults = options.threshold 
      ? results.filter(r => r.ratio > r.threshold)
      : results;

    for (const result of filteredResults) {
      console.log(
        `${result.status} | ${result.file.padEnd(50)} | ` +
        `${result.sourceLines.toString().padStart(10)} | ` +
        `${result.testLines.toString().padStart(10)} | ` +
        `${formatRatio(result.ratio).padStart(5)} | ` +
        `${result.complexityLevel.padEnd(7)} | ` +
        `${formatRatio(result.threshold)}`
      );
    }
    console.log('─'.repeat(100));
  }

  // 統計情報
  const overThresholdCount = results.filter(r => r.ratio > r.threshold).length;
  const warningCount = results.filter(r => r.ratio > CONFIG.thresholds.warning).length;
  const totalRatio = totalSourceLines > 0 ? totalTestLines / totalSourceLines : 0;

  console.log('\n📈 統計情報:');
  console.log(`総ソースコード行数: ${totalSourceLines.toLocaleString()}`);
  console.log(`総テストコード行数: ${totalTestLines.toLocaleString()}`);
  console.log(`全体のテスト比率: ${formatRatio(totalRatio)}`);
  console.log(`分析ファイル数: ${results.length}`);
  console.log(`閾値超過ファイル数: ${overThresholdCount} (${getStatusEmoji(overThresholdCount, 0)} ${(overThresholdCount / results.length * 100).toFixed(1)}%)`);
  console.log(`警告レベルファイル数: ${warningCount} (${getStatusEmoji(warningCount, -1)} ${(warningCount / results.length * 100).toFixed(1)}%)`);

  // 警告レベルのファイルを表示
  if (warningCount > 0) {
    console.log('\n⚠️  警告: 以下のファイルはテストコード量が過剰です（3倍以上）:');
    results
      .filter(r => r.ratio > CONFIG.thresholds.warning)
      .sort((a, b) => b.ratio - a.ratio)
      .forEach(r => {
        console.log(`  - ${r.file} (比率: ${formatRatio(r.ratio)})`);
      });
  }

  return { results, totalSourceLines, totalTestLines, totalRatio };
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    threshold: args.includes('--threshold')
  };

  let projectName = 'frontend'; // デフォルト
  const projectIndex = args.indexOf('--project');
  if (projectIndex !== -1 && args[projectIndex + 1]) {
    projectName = args[projectIndex + 1];
  }

  try {
    await analyzeTestRatio(projectName, options);
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
}

module.exports = { analyzeTestRatio, CONFIG };