#!/usr/bin/env node

/**
 * テスト分析の統合レポート生成スクリプト
 * 
 * 使用方法:
 * node scripts/test-analysis/generate-report.js [オプション]
 * 
 * オプション:
 * --project <name>  分析対象プロジェクト (frontend, api, all)
 * --output <path>   レポート出力先（デフォルト: docs/テスト/test-analysis-report.md）
 */

const fs = require('fs');
const path = require('path');
const { analyzeTestRatio } = require('./test-to-source-ratio');
const { analyzeStorybook } = require('./storybook-analysis');
const { analyzeTestPerformance } = require('./test-performance');

// 設定
const CONFIG = {
  defaultOutput: 'docs/テスト/test-analysis-report.md',
  projects: ['frontend', 'api']
};

// ユーティリティ関数
function formatDate(date) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateMarkdownReport(analyses, projectName) {
  const date = new Date();
  let markdown = `# テスト分析レポート\n\n`;
  markdown += `生成日時: ${formatDate(date)}\n`;
  markdown += `対象プロジェクト: ${projectName}\n\n`;

  // エグゼクティブサマリー
  markdown += `## エグゼクティブサマリー\n\n`;
  
  const summary = {
    totalFiles: 0,
    overThresholdFiles: 0,
    totalTests: 0,
    slowTests: 0,
    recommendations: []
  };

  // テスト比率分析のサマリー
  if (analyses.testRatio) {
    Object.values(analyses.testRatio).forEach(project => {
      summary.totalFiles += project.results.length;
      summary.overThresholdFiles += project.results.filter(r => r.ratio > r.threshold).length;
      
      if (project.results.some(r => r.ratio > 3.0)) {
        summary.recommendations.push('⚠️ オーバーテストが検出されました。テストコードの削減を検討してください。');
      }
    });
  }

  // パフォーマンス分析のサマリー
  if (analyses.performance) {
    Object.values(analyses.performance).forEach(project => {
      if (project.tests) {
        summary.totalTests += project.tests.length;
        summary.slowTests += project.performanceLevels.slow + project.performanceLevels.verySlow;
      }
    });
    
    if (summary.slowTests > summary.totalTests * 0.2) {
      summary.recommendations.push('🐌 遅いテストが多数検出されました。パフォーマンス改善を推奨します。');
    }
  }

  markdown += `- 分析ファイル数: ${summary.totalFiles}\n`;
  markdown += `- 閾値超過ファイル: ${summary.overThresholdFiles}\n`;
  markdown += `- 総テスト数: ${summary.totalTests}\n`;
  markdown += `- 遅いテスト数: ${summary.slowTests}\n\n`;

  if (summary.recommendations.length > 0) {
    markdown += `### 推奨アクション\n\n`;
    summary.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += '\n';
  }

  // テスト比率分析
  if (analyses.testRatio) {
    markdown += `## テストコード比率分析\n\n`;
    
    Object.entries(analyses.testRatio).forEach(([project, data]) => {
      markdown += `### ${project.toUpperCase()}\n\n`;
      markdown += `- 総ソースコード行数: ${data.totalSourceLines.toLocaleString()}\n`;
      markdown += `- 総テストコード行数: ${data.totalTestLines.toLocaleString()}\n`;
      markdown += `- 全体のテスト比率: ${data.totalRatio.toFixed(2)}\n\n`;

      // 警告レベルのファイル
      const warningFiles = data.results.filter(r => r.ratio > 3.0);
      if (warningFiles.length > 0) {
        markdown += `#### ⚠️ 警告: オーバーテストファイル\n\n`;
        markdown += '| ファイル | ソース行数 | テスト行数 | 比率 |\n';
        markdown += '|----------|------------|------------|------|\n';
        warningFiles.forEach(file => {
          markdown += `| ${file.file} | ${file.sourceLines} | ${file.testLines} | ${file.ratio.toFixed(2)} |\n`;
        });
        markdown += '\n';
      }
    });
  }

  // Storybook分析
  if (analyses.storybook) {
    markdown += `## Storybookストーリー分析\n\n`;
    markdown += `- 総ストーリーファイル数: ${analyses.storybook.results.length}\n`;
    markdown += `- 総ストーリー数: ${analyses.storybook.totalStories}\n`;
    markdown += `- 平均ストーリー数: ${(analyses.storybook.totalStories / analyses.storybook.results.length).toFixed(1)}\n\n`;

    const excessiveStories = analyses.storybook.results.filter(r => r.storyCount > r.recommended * 1.5);
    if (excessiveStories.length > 0) {
      markdown += `### ⚠️ 過剰なストーリー数\n\n`;
      markdown += '| ファイル | ストーリー数 | 推奨数 | 複雑度 |\n';
      markdown += '|----------|--------------|--------|--------|\n';
      excessiveStories.forEach(file => {
        markdown += `| ${file.file} | ${file.storyCount} | ${file.recommended} | ${file.complexityLevel} |\n`;
      });
      markdown += '\n';
    }
  }

  // パフォーマンス分析
  if (analyses.performance) {
    markdown += `## テストパフォーマンス分析\n\n`;
    
    Object.entries(analyses.performance).forEach(([project, data]) => {
      if (data.tests && data.tests.length > 0) {
        markdown += `### ${project.toUpperCase()}\n\n`;
        markdown += `- 総テスト数: ${data.tests.length}\n`;
        markdown += `- 総実行時間: ${(data.totalDuration / 1000).toFixed(2)}秒\n`;
        markdown += `- 遅いテスト（1秒以上）: ${data.performanceLevels.slow + data.performanceLevels.verySlow}個\n\n`;

        // 最も遅いテスト上位5件
        const slowTests = data.tests
          .filter(t => t.duration >= 1000)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5);

        if (slowTests.length > 0) {
          markdown += `#### 🐌 最も遅いテスト\n\n`;
          markdown += '| テスト名 | 実行時間 | ファイル |\n';
          markdown += '|----------|----------|----------|\n';
          slowTests.forEach(test => {
            markdown += `| ${test.name.substring(0, 50)} | ${(test.duration / 1000).toFixed(2)}秒 | ${test.file} |\n`;
          });
          markdown += '\n';
        }
      }
    });
  }

  // 改善提案
  markdown += `## 改善提案\n\n`;
  markdown += `### テストコード最適化\n\n`;
  markdown += `1. **オーバーテストの解消**\n`;
  markdown += `   - 3倍を超えるテストコードは削減を検討\n`;
  markdown += `   - パラメタライズドテストの活用\n`;
  markdown += `   - 重複テストの統合\n\n`;

  markdown += `2. **Storybookストーリーの整理**\n`;
  markdown += `   - 視覚的な差がないストーリーは統合\n`;
  markdown += `   - ユニットテストで代替可能な内容は移行\n`;
  markdown += `   - 基本4パターン（Default, Loading, Error, Empty）を優先\n\n`;

  markdown += `3. **パフォーマンス改善**\n`;
  markdown += `   - 1秒以上かかるテストの最適化\n`;
  markdown += `   - セットアップ処理の共通化\n`;
  markdown += `   - 不要な待機時間の削除\n\n`;

  return markdown;
}

// メイン処理
async function generateReport(projectName = 'all', outputPath = CONFIG.defaultOutput) {
  console.log('\n📊 テスト分析レポート生成中...\n');

  const analyses = {
    testRatio: {},
    storybook: null,
    performance: {}
  };

  const projects = projectName === 'all' ? CONFIG.projects : [projectName];

  // テスト比率分析
  for (const project of projects) {
    try {
      console.log(`\n--- ${project} テスト比率分析 ---`);
      analyses.testRatio[project] = await analyzeTestRatio(project, { verbose: false });
    } catch (error) {
      console.error(`${project} のテスト比率分析に失敗:`, error.message);
    }
  }

  // Storybook分析（frontendのみ）
  if (projects.includes('frontend')) {
    try {
      console.log('\n--- Storybook分析 ---');
      analyses.storybook = await analyzeStorybook({ verbose: false });
    } catch (error) {
      console.error('Storybook分析に失敗:', error.message);
    }
  }

  // パフォーマンス分析
  for (const project of projects) {
    try {
      console.log(`\n--- ${project} パフォーマンス分析 ---`);
      analyses.performance[project] = await analyzeTestPerformance(project, { verbose: false });
    } catch (error) {
      console.error(`${project} のパフォーマンス分析に失敗:`, error.message);
    }
  }

  // レポート生成
  const report = generateMarkdownReport(analyses, projectName === 'all' ? '全プロジェクト' : projectName);
  
  // ディレクトリ作成
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // レポート保存
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(`\n✅ レポートを生成しました: ${outputPath}`);

  return report;
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  
  let projectName = 'all';
  const projectIndex = args.indexOf('--project');
  if (projectIndex !== -1 && args[projectIndex + 1]) {
    projectName = args[projectIndex + 1];
  }

  let outputPath = CONFIG.defaultOutput;
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputPath = args[outputIndex + 1];
  }

  try {
    await generateReport(projectName, outputPath);
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
}

module.exports = { generateReport };