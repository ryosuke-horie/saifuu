const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// テスト対象のモジュール（まだ存在しない）
const {
  countLines,
  getComponentCategory,
  isTestFile,
  findSourceFile,
  calculateRatio,
  formatViolation,
  RATIO_LIMITS
} = require('../test-analysis');

describe('test-analysis', () => {
  describe('countLines', () => {
    it('ファイルの行数を正しくカウントすること', () => {
      // 実際のファイルを使用してテスト
      const testFilePath = __filename;
      const content = fs.readFileSync(testFilePath, 'utf-8');
      const expectedLines = content.split('\n').length;
      
      const result = countLines(testFilePath);
      assert.equal(result, expectedLines);
    });

    it('ファイルが読めない場合は0を返すこと', () => {
      const result = countLines('/path/to/nonexistent.ts');
      assert.equal(result, 0);
    });
  });

  describe('getComponentCategory', () => {
    it('100行未満の場合はsmallを返すこと', () => {
      assert.equal(getComponentCategory(50), 'small');
      assert.equal(getComponentCategory(99), 'small');
    });

    it('100行以上300行未満の場合はmediumを返すこと', () => {
      assert.equal(getComponentCategory(100), 'medium');
      assert.equal(getComponentCategory(299), 'medium');
    });

    it('300行以上の場合はlargeを返すこと', () => {
      assert.equal(getComponentCategory(300), 'large');
      assert.equal(getComponentCategory(1000), 'large');
    });
  });

  describe('isTestFile', () => {
    it('テストファイルのパターンにマッチすること', () => {
      assert.equal(isTestFile('/path/to/file.test.ts'), true);
      assert.equal(isTestFile('/path/to/file.test.tsx'), true);
      assert.equal(isTestFile('/path/to/file.spec.ts'), true);
      assert.equal(isTestFile('/path/to/file.spec.tsx'), true);
      assert.equal(isTestFile('/path/to/file.stories.tsx'), true);
    });

    it('通常のファイルはマッチしないこと', () => {
      assert.equal(isTestFile('/path/to/file.ts'), false);
      assert.equal(isTestFile('/path/to/file.tsx'), false);
      assert.equal(isTestFile('/path/to/file.js'), false);
    });
  });

  describe('findSourceFile', () => {
    it('テストファイルに対応するソースファイルを見つけること', () => {
      // 実際に存在するファイルでテスト
      const thisTestFile = __filename;
      const expectedSourceFile = thisTestFile
        .replace(/__tests__[\/\\]/, '')
        .replace('.test.js', '.js');
      
      // 実装がまだ存在しないので、このテストは失敗する
      const result = findSourceFile(thisTestFile);
      assert.equal(result, expectedSourceFile);
    });

    it('ソースファイルが見つからない場合はnullを返すこと', () => {
      const result = findSourceFile('/path/to/nonexistent.test.tsx');
      assert.equal(result, null);
    });
  });

  describe('calculateRatio', () => {
    it('正しく比率を計算すること', () => {
      assert.equal(calculateRatio(100, 50), 2.0);
      assert.equal(calculateRatio(150, 100), 1.5);
      assert.equal(calculateRatio(200, 100), 2.0);
    });

    it('ソースコードが0行の場合は0を返すこと', () => {
      assert.equal(calculateRatio(100, 0), 0);
    });
  });

  describe('formatViolation', () => {
    it('違反情報を正しくフォーマットすること', () => {
      const fileInfo = {
        source: 'src/component.tsx',
        sourceLines: 100,
        testLines: 200,
        ratio: '2.00',
        category: 'small',
        limit: 1.5
      };

      const result = formatViolation(fileInfo);

      assert.deepEqual(result, {
        source: 'src/component.tsx',
        sourceLines: 100,
        testLines: 200,
        ratio: '2.00',
        category: 'small',
        limit: 1.5,
        excess: 50
      });
    });
  });

  describe('RATIO_LIMITS', () => {
    it('正しい制限値が設定されていること', () => {
      assert.deepEqual(RATIO_LIMITS, {
        small: { lines: 100, ratio: 1.5 },
        medium: { lines: 300, ratio: 2.0 },
        large: { lines: Infinity, ratio: 2.5 }
      });
    });
  });
});