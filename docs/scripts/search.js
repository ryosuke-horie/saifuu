#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * ドキュメント検索スクリプト
 * HTMLコメント形式のタグ（<!-- tags: tag1, tag2, tag3 -->）を使用してMarkdownファイルを検索
 */

// 設定定数
const DOCS_DIR = path.join(__dirname, '..');
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'scripts'];

/**
 * コマンドライン引数を解析
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    tags: [],
    operator: 'AND', // AND または OR
    help: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--or') {
      options.operator = 'OR';
    } else if (arg === '--and') {
      options.operator = 'AND';
    } else if (arg.startsWith('--tag=')) {
      const tag = arg.substring(6);
      if (tag) options.tags.push(tag.toLowerCase());
    } else if (arg === '--tag' && i + 1 < args.length) {
      options.tags.push(args[++i].toLowerCase());
    } else if (!arg.startsWith('-')) {
      // プレフィックスがない場合はタグとして扱う
      options.tags.push(arg.toLowerCase());
    }
  }

  return options;
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log(`
📚 Saifuu ドキュメント検索ツール

使用方法:
  npm run docs:search [オプション] [タグ...]

オプション:
  --tag=<タグ>     検索するタグを指定
  --tag <タグ>     検索するタグを指定（別形式）
  --and           複数タグでAND検索（デフォルト）
  --or            複数タグでOR検索
  --verbose, -v   詳細な情報を表示
  --help, -h      このヘルプを表示

使用例:
  npm run docs:search api                    # 'api'タグを検索
  npm run docs:search --tag=frontend        # 'frontend'タグを検索
  npm run docs:search api testing --and     # 'api' AND 'testing'で検索
  npm run docs:search api frontend --or     # 'api' OR 'frontend'で検索
  npm run docs:search --tag=api --tag=backend --verbose

利用可能なタグ例:
  • api, backend, frontend
  • testing, unit-test, e2e, vitest, playwright
  • database, d1, migration
  • logging, logger, monitoring
  • architecture, adr, decision-record
  • tools, ghost, development-tools
  • ci, cd, github-actions, deployment
  • documentation, readme, specification
  `);
}

/**
 * ファイルからタグを抽出
 * @param {string} filePath - ファイルパス
 * @returns {Object} { title: string, tags: string[], filePath: string }
 */
function extractFileMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // タイトルを抽出（最初のH1見出し）
    let title = path.basename(filePath, '.md');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.substring(2).trim();
        break;
      }
    }

    // HTMLコメント形式のタグを抽出: <!-- tags: tag1, tag2, tag3 -->
    const tags = [];
    const tagRegex = /<!--\s*tags:\s*([^>]+)\s*-->/gi;
    
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      const tagString = match[1];
      const fileTags = tagString
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
      tags.push(...fileTags);
    }

    return {
      title,
      tags: [...new Set(tags)], // 重複を除去
      filePath: path.relative(DOCS_DIR, filePath)
    };
  } catch (error) {
    return {
      title: path.basename(filePath, '.md'),
      tags: [],
      filePath: path.relative(DOCS_DIR, filePath)
    };
  }
}

/**
 * ディレクトリを再帰的に探索してMarkdownファイルを収集
 * @param {string} dir - 探索するディレクトリ
 * @returns {string[]} - Markdownファイルのパスの配列
 */
function findMarkdownFiles(dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // 除外ディレクトリをスキップ
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          files.push(...findMarkdownFiles(fullPath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ディレクトリアクセスエラーは無視
  }
  
  return files;
}

/**
 * タグ条件に基づいてファイルをフィルタリング
 * @param {Object[]} fileMetadata - ファイルメタデータの配列
 * @param {string[]} searchTags - 検索タグ
 * @param {string} operator - 'AND' または 'OR'
 * @returns {Object[]} - フィルタリング後のファイルメタデータ
 */
function filterByTags(fileMetadata, searchTags, operator) {
  if (searchTags.length === 0) {
    return fileMetadata;
  }

  return fileMetadata.filter(file => {
    if (operator === 'AND') {
      // すべてのタグが含まれている必要がある
      return searchTags.every(searchTag => 
        file.tags.some(fileTag => fileTag.includes(searchTag))
      );
    } else {
      // いずれかのタグが含まれていればよい
      return searchTags.some(searchTag => 
        file.tags.some(fileTag => fileTag.includes(searchTag))
      );
    }
  });
}

/**
 * 検索結果を表示
 * @param {Object[]} results - 検索結果
 * @param {Object} options - 検索オプション
 */
function displayResults(results, options) {
  if (results.length === 0) {
    console.log('🔍 検索結果が見つかりませんでした。');
    console.log('\n利用可能なタグを確認するには: npm run docs:search --help');
    return;
  }

  console.log(`\n📝 検索結果: ${results.length}件 (${options.tags.join(` ${options.operator} `)})`);
  console.log('═'.repeat(60));

  results.forEach((file, index) => {
    console.log(`\n${index + 1}. ${file.title}`);
    console.log(`   📁 ${file.filePath}`);
    
    if (options.verbose && file.tags.length > 0) {
      console.log(`   🏷️  ${file.tags.join(', ')}`);
    }
  });

  console.log('\n');
}

/**
 * 全体統計を表示（verboseモード）
 * @param {Object[]} allFiles - すべてのファイル
 */
function displayStatistics(allFiles) {
  const allTags = new Set();
  allFiles.forEach(file => {
    file.tags.forEach(tag => allTags.add(tag));
  });

  console.log('\n📊 ドキュメント統計:');
  console.log(`   📄 総ファイル数: ${allFiles.length}`);
  console.log(`   🏷️  総タグ数: ${allTags.size}`);
  
  if (allTags.size > 0) {
    console.log('\n   🔤 利用可能なタグ:');
    const sortedTags = Array.from(allTags).sort();
    const tagGroups = [];
    for (let i = 0; i < sortedTags.length; i += 6) {
      tagGroups.push(sortedTags.slice(i, i + 6));
    }
    tagGroups.forEach(group => {
      console.log(`      ${group.join(', ')}`);
    });
  }
}

/**
 * メイン実行関数
 */
function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('🔍 ドキュメント検索を開始...');
  
  // Markdownファイルを収集
  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  
  // メタデータを抽出
  const fileMetadata = markdownFiles.map(extractFileMetadata);
  
  if (options.verbose) {
    displayStatistics(fileMetadata);
  }

  // タグでフィルタリング
  const results = filterByTags(fileMetadata, options.tags, options.operator);
  
  // 結果を表示
  displayResults(results, options);
}

// スクリプトが直接実行された場合のみmainを実行
if (require.main === module) {
  main();
}

module.exports = {
  extractFileMetadata,
  findMarkdownFiles,
  filterByTags,
  parseArguments
};