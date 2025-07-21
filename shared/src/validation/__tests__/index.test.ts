import { describe, expect, it } from 'vitest';
import {
  required,
  numeric,
  positiveNumber,
  string,
  date,
  enumValidator,
  compose,
  validateObject,
  validators,
  VALIDATION_LIMITS,
  type ValidationError,
} from '../index';

describe('Validation Framework', () => {
  describe('required validator', () => {
    it('nullを拒否する', () => {
      const validator = required();
      const result = validator(null, 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは必須です',
        code: 'REQUIRED',
      });
    });

    it('undefinedを拒否する', () => {
      const validator = required();
      const result = validator(undefined, 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは必須です',
        code: 'REQUIRED',
      });
    });

    it('空文字列を拒否する', () => {
      const validator = required<string>();
      const result = validator('', 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは必須です',
        code: 'REQUIRED',
      });
    });

    it('有効な値を受け入れる', () => {
      const validator = required<string>();
      expect(validator('value', 'field')).toBeNull();
      expect(validator(0, 'field')).toBeNull();
      expect(validator(false, 'field')).toBeNull();
    });

    it('カスタムメッセージをサポートする', () => {
      const validator = required('カスタムエラー');
      const result = validator(null, 'field');
      expect(result?.message).toBe('カスタムエラー');
    });
  });

  describe('numeric validator', () => {
    it('数値でない値を拒否する', () => {
      const validator = numeric();
      const result = validator('not a number' as any, 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは数値である必要があります',
        code: 'INVALID_NUMBER',
      });
    });

    it('NaNを拒否する', () => {
      const validator = numeric();
      const result = validator(NaN, 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは数値である必要があります',
        code: 'INVALID_NUMBER',
      });
    });

    it('最小値チェックを行う', () => {
      const validator = numeric(10);
      expect(validator(9, 'field')).toEqual({
        field: 'field',
        message: 'fieldは10以上である必要があります',
        code: 'MIN_VALUE',
      });
      expect(validator(10, 'field')).toBeNull();
      expect(validator(11, 'field')).toBeNull();
    });

    it('最大値チェックを行う', () => {
      const validator = numeric(undefined, 100);
      expect(validator(101, 'field')).toEqual({
        field: 'field',
        message: 'fieldは100以下である必要があります',
        code: 'MAX_VALUE',
      });
      expect(validator(100, 'field')).toBeNull();
      expect(validator(99, 'field')).toBeNull();
    });

    it('範囲チェックを行う', () => {
      const validator = numeric(10, 100);
      expect(validator(9, 'field')?.code).toBe('MIN_VALUE');
      expect(validator(101, 'field')?.code).toBe('MAX_VALUE');
      expect(validator(50, 'field')).toBeNull();
    });
  });

  describe('positiveNumber validator', () => {
    it('正の数を受け入れる', () => {
      const validator = positiveNumber();
      expect(validator(1, 'field')).toBeNull();
      expect(validator(100, 'field')).toBeNull();
      expect(validator(0.1, 'field')).toBeNull();
    });

    it('ゼロ以下を拒否する', () => {
      const validator = positiveNumber();
      expect(validator(0, 'field')).toEqual({
        field: 'field',
        message: 'fieldは正の数値である必要があります',
        code: 'POSITIVE_NUMBER',
      });
      expect(validator(-1, 'field')).toBeTruthy();
    });
  });

  describe('string validator', () => {
    it('文字列でない値を拒否する', () => {
      const validator = string();
      const result = validator(123 as any, 'field');
      expect(result).toEqual({
        field: 'field',
        message: 'fieldは文字列である必要があります',
        code: 'INVALID_STRING',
      });
    });

    it('最大長チェックを行う', () => {
      const validator = string(5);
      expect(validator('12345', 'field')).toBeNull();
      expect(validator('123456', 'field')).toEqual({
        field: 'field',
        message: 'fieldは5文字以下である必要があります',
        code: 'MAX_LENGTH',
      });
    });

    it('空文字列を受け入れる', () => {
      const validator = string(10);
      expect(validator('', 'field')).toBeNull();
    });
  });

  describe('date validator', () => {
    it('有効な日付を受け入れる', () => {
      const validator = date();
      expect(validator(new Date(), 'field')).toBeNull();
      expect(validator('2024-01-01', 'field')).toBeNull();
    });

    it('無効な日付を拒否する', () => {
      const validator = date();
      expect(validator('invalid date', 'field')).toEqual({
        field: 'field',
        message: 'fieldは有効な日付である必要があります',
        code: 'INVALID_DATE',
      });
    });

    it('最小日付チェックを行う', () => {
      const minDate = new Date('2024-01-01');
      const validator = date(minDate);
      
      expect(validator('2023-12-31', 'field')).toEqual({
        field: 'field',
        message: 'fieldは2024-01-01以降である必要があります',
        code: 'MIN_DATE',
      });
      expect(validator('2024-01-01', 'field')).toBeNull();
      expect(validator('2024-01-02', 'field')).toBeNull();
    });
  });

  describe('enumValidator', () => {
    it('許可された値を受け入れる', () => {
      const validator = enumValidator(['A', 'B', 'C'] as const);
      expect(validator('A', 'field')).toBeNull();
      expect(validator('B', 'field')).toBeNull();
      expect(validator('C', 'field')).toBeNull();
    });

    it('許可されていない値を拒否する', () => {
      const validator = enumValidator(['A', 'B', 'C'] as const);
      expect(validator('D' as any, 'field')).toEqual({
        field: 'field',
        message: 'fieldはA, B, Cのいずれかである必要があります',
        code: 'INVALID_ENUM',
      });
    });

    it('数値のenumをサポートする', () => {
      const validator = enumValidator([1, 2, 3] as const);
      expect(validator(1, 'field')).toBeNull();
      expect(validator(4 as any, 'field')).toBeTruthy();
    });
  });

  describe('compose validator', () => {
    it('複数のバリデーターを順番に実行する', () => {
      const validator = compose(
        required<number>(),
        numeric(0, 100)
      );
      
      expect(validator(null as any, 'field')?.code).toBe('REQUIRED');
      expect(validator(101, 'field')?.code).toBe('MAX_VALUE');
      expect(validator(50, 'field')).toBeNull();
    });

    it('最初のエラーで停止する', () => {
      const validator = compose(
        required<number>(),
        positiveNumber(),
        numeric(0, 100)
      );
      
      // requiredで失敗するので、positiveNumberは実行されない
      const result = validator(null as any, 'field');
      expect(result?.code).toBe('REQUIRED');
    });
  });

  describe('validateObject', () => {
    it('オブジェクト全体をバリデートする', () => {
      const data = {
        name: 'テスト',
        amount: 1000,
        description: '説明',
      };

      const result = validateObject(data, {
        name: required<string>(),
        amount: compose(required<number>(), positiveNumber()),
        description: string(100),
      });

      expect(result).toEqual({ success: true, data });
    });

    it('複数のエラーを収集する', () => {
      const data = {
        name: '',
        amount: -100,
        description: 'a'.repeat(101),
      };

      const result = validateObject(data, {
        name: required<string>(),
        amount: positiveNumber(),
        description: string(100),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(3);
        expect(result.errors.map(e => e.field)).toEqual(['name', 'amount', 'description']);
      }
    });

    it('配列形式のバリデーターをサポートする', () => {
      const data = { amount: 50 };
      
      const result = validateObject(data, {
        amount: [required<number>(), positiveNumber(), numeric(0, 100)],
      });

      expect(result).toEqual({ success: true, data });
    });
  });

  describe('preset validators', () => {
    it('amount validatorが正しく動作する', () => {
      expect(validators.amount(null as any, 'amount')?.code).toBe('REQUIRED');
      expect(validators.amount(0, 'amount')?.code).toBe('POSITIVE_NUMBER');
      expect(validators.amount(VALIDATION_LIMITS.MAX_AMOUNT + 1, 'amount')?.code).toBe('MAX_VALUE');
      expect(validators.amount(1000, 'amount')).toBeNull();
    });

    it('name validatorが正しく動作する', () => {
      expect(validators.name('', 'name')?.code).toBe('REQUIRED');
      expect(validators.name('a'.repeat(VALIDATION_LIMITS.MAX_NAME_LENGTH + 1), 'name')?.code).toBe('MAX_LENGTH');
      expect(validators.name('テスト名', 'name')).toBeNull();
    });

    it('description validatorが正しく動作する', () => {
      // descriptionはオプショナルなのでnullやundefinedは受け入れる
      expect(validators.description(null as any, 'description')).toBeNull();
      expect(validators.description('a'.repeat(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH + 1), 'description')?.code).toBe('MAX_LENGTH');
      expect(validators.description('説明文', 'description')).toBeNull();
    });

    it('date validatorが正しく動作する', () => {
      expect(validators.date(null as any, 'date')?.code).toBe('REQUIRED');
      expect(validators.date('1999-12-31', 'date')?.code).toBe('MIN_DATE');
      expect(validators.date('2024-01-01', 'date')).toBeNull();
    });
  });

  describe('validation limits', () => {
    it('期待される制限値を持つ', () => {
      expect(VALIDATION_LIMITS.MAX_AMOUNT).toBe(10_000_000);
      expect(VALIDATION_LIMITS.MIN_AMOUNT).toBe(1);
      expect(VALIDATION_LIMITS.MAX_NAME_LENGTH).toBe(100);
      expect(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH).toBe(500);
      expect(VALIDATION_LIMITS.MIN_DATE).toEqual(new Date('2000-01-01'));
    });
  });
});