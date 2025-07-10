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
});