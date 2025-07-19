#!/usr/bin/env node

/**
 * テスト実行パフォーマンスの分析スクリプト
 * 
 * 使用方法:
 * node scripts/test-analysis/test-performance.js [オプション]
 * 
 * オプション:
 * --project <name>  分析対象プロジェクト (frontend, api, e2e)
 * --slow            遅いテストのみ表示（1秒以上）
 * --top <n>         上位n個の遅いテストを表示（デフォルト: 10）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const CONFIG = {
  projects: {
    frontend: {
      testCommand: 'cd frontend && npm run test:unit -- --reporter=json',
      reportPath: 'frontend/coverage/test-results.json'
    },
    api: {
      testCommand: 'cd api && npm run test:unit -- --reporter=json',
      reportPath: 'api/coverage/test-results.json'
    },
    e2e: {
      testCommand: 'cd e2e && npm test -- --reporter=json',
      reportPath: 'e2e/test-results.json'
    }
  },
  thresholds: {
    fast: 100,      // 100ms未満
    normal: 1000,   // 1秒未満
    slow: 3000,     // 3秒未満
    verySlow: 5000  // 5秒以上
  }
};

// ユーティリティ関数
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getPerformanceLevel(duration) {
  if (duration < CONFIG.thresholds.fast) return { level: 'fast', emoji: '⚡' };
  if (duration < CONFIG.thresholds.normal) return { level: 'normal', emoji: '🟢' };
  if (duration < CONFIG.thresholds.slow) return { level: 'slow', emoji: '🟡' };
  return { level: 'verySlow', emoji: '🔴' };
}

function runTests(project) {
  console.log(`テストを実行中... (${project.testCommand})`);
  try {
    execSync(project.testCommand, { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return true;
  } catch (error) {
    // テストが失敗してもパフォーマンス分析は続行
    console.warn('⚠️  一部のテストが失敗しましたが、パフォーマンス分析を続行します。');
    return true;
  }
}

function parseTestResults(reportPath) {
  try {
    const content = fs.readFileSync(reportPath, 'utf8');
    const data = JSON.parse(content);
    
    const tests = [];
    
    // Vitest JSON レポート形式をパース
    if (data.testResults) {
      data.testResults.forEach(suite => {
        suite.assertionResults.forEach(test => {
          tests.push({
            name: test.fullName || test.title,
            duration: test.duration || 0,
            status: test.status,
            file: path.relative(process.cwd(), suite.name)
          });
        });
      });
    }

    return tests;
  } catch (error) {
    console.error('テスト結果の解析に失敗しました:', error.message);
    return [];
  }
}

// メイン処理
async function analyzeTestPerformance(projectName, options = {}) {
  const project = CONFIG.projects[projectName];
  if (!project) {
    console.error(`不正なプロジェクト名: ${projectName}`);
    console.log('利用可能なプロジェクト:', Object.keys(CONFIG.projects).join(', '));
    process.exit(1);
  }

  console.log(`\n⏱️  ${projectName.toUpperCase()} プロジェクトのテストパフォーマンス分析\n`);

  // テストを実行（既存のレポートがない場合）
  if (!fs.existsSync(project.reportPath)) {
    console.log('テスト結果が見つかりません。テストを実行します...');
    const success = runTests(project);
    if (!success) {
      console.error('テストの実行に失敗しました。');
      process.exit(1);
    }
  }

  // テスト結果を解析
  const tests = parseTestResults(project.reportPath);
  if (tests.length === 0) {
    console.log('解析可能なテスト結果が見つかりませんでした。');
    console.log('ヒント: テストを実行してJSON形式のレポートを生成してください。');
    return;
  }

  // パフォーマンス分析
  const sortedTests = tests.sort((a, b) => b.duration - a.duration);
  const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
  const avgDuration = totalDuration / tests.length;

  // パフォーマンスレベル別に分類
  const performanceLevels = {
    fast: 0,
    normal: 0,
    slow: 0,
    verySlow: 0
  };

  tests.forEach(test => {
    const { level } = getPerformanceLevel(test.duration);
    performanceLevels[level]++;
  });

  // 統計情報の表示
  console.log('📊 統計情報:');
  console.log(`総テスト数: ${tests.length}`);
  console.log(`総実行時間: ${formatDuration(totalDuration)}`);
  console.log(`平均実行時間: ${formatDuration(avgDuration)}`);
  console.log(`最速テスト: ${formatDuration(sortedTests[sortedTests.length - 1].duration)}`);
  console.log(`最遅テスト: ${formatDuration(sortedTests[0].duration)}`);
  
  console.log('\n📈 パフォーマンス分布:');
  console.log(`⚡ 高速 (<100ms): ${performanceLevels.fast} (${(performanceLevels.fast / tests.length * 100).toFixed(1)}%)`);
  console.log(`🟢 通常 (<1s): ${performanceLevels.normal} (${(performanceLevels.normal / tests.length * 100).toFixed(1)}%)`);
  console.log(`🟡 遅い (<3s): ${performanceLevels.slow} (${(performanceLevels.slow / tests.length * 100).toFixed(1)}%)`);
  console.log(`🔴 非常に遅い (≥3s): ${performanceLevels.verySlow} (${(performanceLevels.verySlow / tests.length * 100).toFixed(1)}%)`);

  // 遅いテストの表示
  const threshold = options.slow ? CONFIG.thresholds.normal : 0;
  const limit = options.top || 10;
  const slowTests = sortedTests.filter(test => test.duration >= threshold);

  if (slowTests.length > 0) {
    console.log(`\n🐌 ${options.slow ? '遅い' : '最も遅い'}テスト (上位${Math.min(limit, slowTests.length)}件):`);
    console.log('─'.repeat(100));
    console.log('状態 | 実行時間 | テスト名 | ファイル');
    console.log('─'.repeat(100));

    slowTests.slice(0, limit).forEach(test => {
      const { emoji } = getPerformanceLevel(test.duration);
      console.log(
        `${emoji} | ${formatDuration(test.duration).padStart(8)} | ` +
        `${test.name.substring(0, 50).padEnd(50)} | ` +
        `${test.file}`
      );
    });
    console.log('─'.repeat(100));
  }

  // 最適化の推奨事項
  if (performanceLevels.verySlow > 0 || performanceLevels.slow > tests.length * 0.2) {
    console.log('\n💡 最適化の推奨事項:');
    console.log('- 遅いテストを分析し、不要な待機時間を削除');
    console.log('- 重いセットアップ処理を共通化');
    console.log('- モックの使用を検討');
    console.log('- 並列実行の活用');
    console.log('- データベースやAPIの呼び出しを最小限に');
  }

  // ファイル別の集計
  const fileStats = {};
  tests.forEach(test => {
    if (!fileStats[test.file]) {
      fileStats[test.file] = {
        count: 0,
        totalDuration: 0,
        slowTests: 0
      };
    }
    fileStats[test.file].count++;
    fileStats[test.file].totalDuration += test.duration;
    if (test.duration >= CONFIG.thresholds.slow) {
      fileStats[test.file].slowTests++;
    }
  });

  // 最も時間のかかるファイルを表示
  const sortedFiles = Object.entries(fileStats)
    .map(([file, stats]) => ({ file, ...stats }))
    .sort((a, b) => b.totalDuration - a.totalDuration);

  if (sortedFiles.length > 0) {
    console.log('\n📁 最も時間のかかるテストファイル (上位5件):');
    sortedFiles.slice(0, 5).forEach(file => {
      console.log(
        `  - ${file.file}: ${formatDuration(file.totalDuration)} ` +
        `(${file.count}テスト, ${file.slowTests}個の遅いテスト)`
      );
    });
  }

  return { tests, totalDuration, performanceLevels };
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  const options = {
    slow: args.includes('--slow')
  };

  // --topオプションの処理
  const topIndex = args.indexOf('--top');
  if (topIndex !== -1 && args[topIndex + 1]) {
    options.top = parseInt(args[topIndex + 1], 10);
  }

  let projectName = 'frontend'; // デフォルト
  const projectIndex = args.indexOf('--project');
  if (projectIndex !== -1 && args[projectIndex + 1]) {
    projectName = args[projectIndex + 1];
  }

  try {
    await analyzeTestPerformance(projectName, options);
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
}

module.exports = { analyzeTestPerformance, CONFIG };