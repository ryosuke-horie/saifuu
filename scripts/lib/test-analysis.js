/**
 * @fileoverview テストコード監視スクリプト用の共通分析機能
 * 
 * このモジュールは、テストコードとソースコードの比率を分析するための
 * 共通機能を提供します。オーバーテストを防止し、適切なテストカバレッジを
 * 維持するために使用されます。
 * 
 * @module test-analysis
 */

const fs = require('fs');
const path = require('path');

/**
 * コンポーネントサイズ別の比率上限
 * @constant {Object} RATIO_LIMITS
 * @property {Object} small - 小規模コンポーネント（100行未満）
 * @property {number} small.lines - 行数の閾値
 * @property {number} small.ratio - テストコード比率の上限
 * @property {Object} medium - 中規模コンポーネント（100-300行）
 * @property {number} medium.lines - 行数の閾値
 * @property {number} medium.ratio - テストコード比率の上限
 * @property {Object} large - 大規模コンポーネント（300行以上）
 * @property {number} large.lines - 行数の閾値（Infinity）
 * @property {number} large.ratio - テストコード比率の上限
 */
const RATIO_LIMITS = {
  small: { lines: 100, ratio: 1.5 },
  medium: { lines: 300, ratio: 2.0 },
  large: { lines: Infinity, ratio: 2.5 }
};

/**
 * ファイルの行数をカウントする
 * @param {string} filePath - カウント対象のファイルパス
 * @returns {number} ファイルの行数（読み取り失敗時は0）
 * @example
 * const lines = countLines('/path/to/file.ts');
 * console.log(lines); // 150
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
 * コンポーネントのサイズカテゴリを判定する
 * @param {number} lines - ソースコードの行数
 * @returns {'small'|'medium'|'large'} サイズカテゴリ
 * @example
 * const category = getComponentCategory(150);
 * console.log(category); // 'medium'
 */
function getComponentCategory(lines) {
  if (lines < RATIO_LIMITS.small.lines) return 'small';
  if (lines < RATIO_LIMITS.medium.lines) return 'medium';
  return 'large';
}

/**
 * ファイルがテストファイルかどうかを判定する
 * @param {string} filepath - 判定対象のファイルパス
 * @returns {boolean} テストファイルの場合true
 * @example
 * console.log(isTestFile('component.test.tsx')); // true
 * console.log(isTestFile('component.tsx')); // false
 */
function isTestFile(filepath) {
  return /\.(test|spec|stories)\.(ts|tsx)$/.test(filepath);
}

/**
 * テストファイルに対応するソースファイルを見つける
 * @param {string} testFile - テストファイルのパス
 * @returns {string|null} 対応するソースファイルのパス、見つからない場合はnull
 * @example
 * const sourceFile = findSourceFile('/path/to/component.test.tsx');
 * console.log(sourceFile); // '/path/to/component.tsx'
 */
function findSourceFile(testFile) {
  const baseName = testFile
    .replace(/\.(test|spec|stories)\.(ts|tsx|js)$/, '')
    .replace(/__tests__[\/\\]/, '');
  
  const extensions = ['.ts', '.tsx', '.js'];
  
  for (const ext of extensions) {
    const sourcePath = baseName + ext;
    if (fs.existsSync(sourcePath)) {
      return sourcePath;
    }
  }
  
  return null;
}

/**
 * テストコードとソースコードの比率を計算する
 * @param {number} testLines - テストコードの行数
 * @param {number} sourceLines - ソースコードの行数
 * @returns {number} 比率（ソースコードが0行の場合は0）
 * @example
 * const ratio = calculateRatio(150, 100);
 * console.log(ratio); // 1.5
 */
function calculateRatio(testLines, sourceLines) {
  if (sourceLines === 0) return 0;
  return testLines / sourceLines;
}

/**
 * 違反情報をフォーマットする
 * @param {Object} fileInfo - ファイル情報
 * @param {string} fileInfo.source - ソースファイルパス
 * @param {number} fileInfo.sourceLines - ソースコードの行数
 * @param {number} fileInfo.testLines - テストコードの行数
 * @param {string} fileInfo.ratio - 比率（文字列形式）
 * @param {string} fileInfo.category - サイズカテゴリ
 * @param {number} fileInfo.limit - 比率の上限
 * @returns {Object} 超過行数を含む違反情報
 * @example
 * const violation = formatViolation({
 *   source: 'src/component.tsx',
 *   sourceLines: 100,
 *   testLines: 200,
 *   ratio: '2.00',
 *   category: 'small',
 *   limit: 1.5
 * });
 * console.log(violation.excess); // 50
 */
function formatViolation(fileInfo) {
  const { sourceLines, ratio, limit } = fileInfo;
  const excess = Math.floor((parseFloat(ratio) - limit) * sourceLines);
  
  return {
    ...fileInfo,
    excess
  };
}

module.exports = {
  countLines,
  getComponentCategory,
  isTestFile,
  findSourceFile,
  calculateRatio,
  formatViolation,
  RATIO_LIMITS
};