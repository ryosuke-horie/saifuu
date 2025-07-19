#!/usr/bin/env node

/**
 * Storybookストーリーの分析スクリプト
 * 
 * 使用方法:
 * node scripts/test-analysis/storybook-analysis.js [オプション]
 * 
 * オプション:
 * --verbose         詳細な出力を表示
 * --duplicates      重複パターンの検出
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// 設定
const CONFIG = {
  storyPattern: 'frontend/src/**/*.stories.{ts,tsx}',
  componentPattern: 'frontend/src/**/*.{ts,tsx}',
  excludePatterns: [
    '**/node_modules/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/.next/**'
  ],
  recommendedStories: {
    simple: 3,    // シンプルコンポーネント
    medium: 5,    // 中規模コンポーネント
    complex: 10   // 複雑コンポーネント
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

function extractStories(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stories = [];
    
    // export const StoryName の形式を検索
    const storyMatches = content.match(/export\s+const\s+(\w+)\s*:\s*Story/g) || [];
    storyMatches.forEach(match => {
      const nameMatch = match.match(/export\s+const\s+(\w+)/);
      if (nameMatch) {
        stories.push(nameMatch[1]);
      }
    });

    return stories;
  } catch (error) {
    console.error(`ストーリー抽出エラー: ${filePath}`);
    return [];
  }
}

function getComplexityLevel(lines) {
  if (lines < 100) return 'simple';
  if (lines < 400) return 'medium';
  return 'complex';
}

function findDuplicatePatterns(allStories) {
  const patterns = {};
  const duplicates = [];

  // ストーリー名のパターンを分析
  allStories.forEach(({ file, stories }) => {
    stories.forEach(story => {
      // 一般的なパターンを正規化
      const normalized = story
        .replace(/\d+/g, 'N')  // 数字を正規化
        .replace(/With|Has|Is/g, 'X')  // 一般的なプレフィックスを正規化
        .toLowerCase();

      if (!patterns[normalized]) {
        patterns[normalized] = [];
      }
      patterns[normalized].push({ file, story });
    });
  });

  // 重複パターンを検出
  Object.entries(patterns).forEach(([pattern, instances]) => {
    if (instances.length > 3) {  // 3回以上出現するパターン
      duplicates.push({
        pattern,
        count: instances.length,
        instances: instances.slice(0, 5)  // 最初の5つまで
      });
    }
  });

  return duplicates.sort((a, b) => b.count - a.count);
}

// メイン処理
async function analyzeStorybook(options = {}) {
  console.log('\n📚 Storybook ストーリー分析\n');

  // ストーリーファイルを取得
  const storyFiles = await glob(CONFIG.storyPattern);
  
  const results = [];
  const allStories = [];
  let totalStories = 0;

  for (const storyFile of storyFiles) {
    const relativePath = path.relative(process.cwd(), storyFile);
    
    // 対応するコンポーネントファイルを探す
    const componentFile = storyFile.replace('.stories', '');
    const componentExists = fs.existsSync(componentFile);
    const componentLines = componentExists ? countLines(componentFile) : 0;
    const complexityLevel = getComplexityLevel(componentLines);
    
    // ストーリーを抽出
    const stories = extractStories(storyFile);
    const storyCount = stories.length;
    totalStories += storyCount;
    
    const recommended = CONFIG.recommendedStories[complexityLevel];
    const status = storyCount <= recommended ? '🟢' : 
                  storyCount <= recommended * 1.5 ? '🟡' : '🔴';

    results.push({
      file: relativePath,
      componentLines,
      complexityLevel,
      storyCount,
      stories,
      recommended,
      status
    });

    allStories.push({ file: relativePath, stories });
  }

  // 結果の表示
  if (options.verbose) {
    console.log('ファイル別分析結果:');
    console.log('─'.repeat(100));
    console.log('状態 | ストーリーファイル | コンポーネント行数 | 複雑度 | ストーリー数 | 推奨数');
    console.log('─'.repeat(100));

    for (const result of results) {
      console.log(
        `${result.status} | ${result.file.padEnd(50)} | ` +
        `${result.componentLines.toString().padStart(15)} | ` +
        `${result.complexityLevel.padEnd(7)} | ` +
        `${result.storyCount.toString().padStart(12)} | ` +
        `${result.recommended.toString().padStart(6)}`
      );
    }
    console.log('─'.repeat(100));
  }

  // 統計情報
  const overRecommended = results.filter(r => r.storyCount > r.recommended).length;
  const excessiveStories = results.filter(r => r.storyCount > r.recommended * 1.5).length;

  console.log('\n📈 統計情報:');
  console.log(`総ストーリーファイル数: ${results.length}`);
  console.log(`総ストーリー数: ${totalStories}`);
  console.log(`平均ストーリー数: ${(totalStories / results.length).toFixed(1)}`);
  console.log(`推奨数超過ファイル: ${overRecommended} (${(overRecommended / results.length * 100).toFixed(1)}%)`);
  console.log(`過剰なストーリー数: ${excessiveStories} (${(excessiveStories / results.length * 100).toFixed(1)}%)`);

  // 過剰なストーリーを持つファイルを表示
  if (excessiveStories > 0) {
    console.log('\n⚠️  警告: 以下のファイルはストーリー数が過剰です:');
    results
      .filter(r => r.storyCount > r.recommended * 1.5)
      .sort((a, b) => b.storyCount - a.storyCount)
      .forEach(r => {
        console.log(`  - ${r.file} (${r.storyCount}個, 推奨: ${r.recommended}個)`);
      });
  }

  // 重複パターンの検出
  if (options.duplicates) {
    const duplicates = findDuplicatePatterns(allStories);
    if (duplicates.length > 0) {
      console.log('\n🔍 重複パターン検出:');
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`\nパターン: "${dup.pattern}" (${dup.count}回出現)`);
        dup.instances.forEach(inst => {
          console.log(`  - ${inst.file}: ${inst.story}`);
        });
      });
    }
  }

  // 推奨事項
  console.log('\n💡 推奨事項:');
  const basicStories = ['Default', 'Loading', 'Error', 'Empty'];
  console.log(`- 基本ストーリー: ${basicStories.join(', ')}`);
  console.log('- シンプルコンポーネント: 3-5個のストーリー');
  console.log('- 中規模コンポーネント: 5-8個のストーリー');
  console.log('- 複雑なコンポーネント: 8-10個のストーリー');
  console.log('- 類似のストーリーは統合を検討してください');

  return { results, totalStories };
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    duplicates: args.includes('--duplicates')
  };

  try {
    await analyzeStorybook(options);
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main();
}

module.exports = { analyzeStorybook, CONFIG };