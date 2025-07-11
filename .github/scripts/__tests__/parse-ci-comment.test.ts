import { describe, it, expect } from 'vitest';
import { parseCIComment } from '../parse-ci-comment';

describe('parseCIComment', () => {
  describe('APIコマンドのパース', () => {
    it('/ci api コマンドを正しく認識する', () => {
      const result = parseCIComment('/ci api');
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });

    it('コマンドの前後に空白があっても認識する', () => {
      const result = parseCIComment('  /ci api  ');
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });

    it('コメント内にコマンドがあっても認識する', () => {
      const result = parseCIComment('修正しました。\n/ci api\nよろしくお願いします。');
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });
  });

  describe('Frontendコマンドのパース', () => {
    it('/ci frontend コマンドを正しく認識する', () => {
      const result = parseCIComment('/ci frontend');
      expect(result).toEqual({
        isValid: true,
        targets: ['frontend']
      });
    });
  });

  describe('複数ターゲットのパース', () => {
    it('複数のCIコマンドを認識する', () => {
      const result = parseCIComment('/ci api\n/ci frontend');
      expect(result).toEqual({
        isValid: true,
        targets: ['api', 'frontend']
      });
    });

    it('重複するコマンドは一度だけ含める', () => {
      const result = parseCIComment('/ci api\n/ci api');
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });
  });

  describe('無効なコマンドの処理', () => {
    it('CIコマンドが含まれない場合はisValidがfalse', () => {
      const result = parseCIComment('コメントです');
      expect(result).toEqual({
        isValid: false,
        targets: []
      });
    });

    it('不正なターゲットは無視される', () => {
      const result = parseCIComment('/ci unknown');
      expect(result).toEqual({
        isValid: false,
        targets: []
      });
    });

    it('部分的に有効なコマンドがある場合', () => {
      const result = parseCIComment('/ci api\n/ci unknown');
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });
  });

  describe('特殊文字・HTMLタグを含むコメントの処理', () => {
    it('HTMLタグを含むコメントでもCIコマンドを正しく認識する', () => {
      const commentWithHtml = `<!-- HTMLコメント -->
<img src="test.gif" />
/ci api
<div>HTMLタグ</div>`;
      const result = parseCIComment(commentWithHtml);
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });

    it('Claude Code自動生成GIFタグを含むコメントでも正常に動作する', () => {
      const commentWithGif = `修正しました。

![demo](https://example.com/demo.gif)

/ci frontend

テストお願いします。`;
      const result = parseCIComment(commentWithGif);
      expect(result).toEqual({
        isValid: true,
        targets: ['frontend']
      });
    });

    it('シングルクォート、ダブルクォートを含むコメントでも正常に動作する', () => {
      const commentWithQuotes = `コメント'内容"です
/ci frontend
さらに'追加"情報`;
      const result = parseCIComment(commentWithQuotes);
      expect(result).toEqual({
        isValid: true,
        targets: ['frontend']
      });
    });

    it('バックスラッシュを含むコメントでも正常に動作する', () => {
      const commentWithBackslash = `パス\\を\\含む\\コメント
/ci api
\\n改行文字`;
      const result = parseCIComment(commentWithBackslash);
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });

    it('複数行HTMLとCIコマンドの組み合わせ', () => {
      const complexComment = `<details>
<summary>変更内容</summary>

- 機能追加
- バグ修正

</details>

/ci api
/ci frontend

<code>npm test</code>で確認済み`;
      const result = parseCIComment(complexComment);
      expect(result).toEqual({
        isValid: true,
        targets: ['api', 'frontend']
      });
    });

    it('JavaScriptで問題となる特殊文字の組み合わせ', () => {
      const problematicComment = `const test = "value";
var x = 'string';
/ci api
\${variable}template literal`;
      const result = parseCIComment(problematicComment);
      expect(result).toEqual({
        isValid: true,
        targets: ['api']
      });
    });
  });

  describe('エッジケース', () => {
    it('空文字列の場合', () => {
      const result = parseCIComment('');
      expect(result).toEqual({
        isValid: false,
        targets: []
      });
    });

    it('undefined が渡された場合', () => {
      const result = parseCIComment(undefined as any);
      expect(result).toEqual({
        isValid: false,
        targets: []
      });
    });

    it('null が渡された場合', () => {
      const result = parseCIComment(null as any);
      expect(result).toEqual({
        isValid: false,
        targets: []
      });
    });
  });
});