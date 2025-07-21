// 共通バリデーションフレームワーク
// API/Frontend間で共有される型安全なバリデーションロジックを提供

// バリデーション結果の型定義
export type ValidationResult<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

// バリデーションエラーの型定義
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// バリデーター関数の型定義
export type Validator<T = unknown> = (value: T, fieldName: string) => ValidationError | null;

// バリデーションルールの型定義
export interface ValidationRule<T = unknown> {
  validator: Validator<T>;
  message?: string;
}

// 共通バリデーション定数
export const VALIDATION_LIMITS = {
  // 金額の上限（API/Frontend統一）
  MAX_AMOUNT: 10_000_000, // ¥10,000,000
  MIN_AMOUNT: 1,
  
  // 文字列長の上限
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // その他の制約
  MIN_DATE: new Date('2000-01-01'),
} as const;

// エラーメッセージテンプレート
export const ERROR_MESSAGES = {
  REQUIRED: '{field}は必須です',
  MIN_VALUE: '{field}は{min}以上である必要があります',
  MAX_VALUE: '{field}は{max}以下である必要があります',
  MAX_LENGTH: '{field}は{max}文字以下である必要があります',
  INVALID_DATE: '{field}は有効な日付である必要があります',
  INVALID_ENUM: '{field}は{values}のいずれかである必要があります',
  POSITIVE_NUMBER: '{field}は正の数値である必要があります',
} as const;

// 必須フィールドバリデーター
export const required = <T>(customMessage?: string): Validator<T> => {
  return (value: T, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.REQUIRED.replace('{field}', fieldName),
        code: 'REQUIRED',
      };
    }
    return null;
  };
};

// 数値範囲バリデーター
export const numeric = (min?: number, max?: number, customMessage?: string): Validator<number> => {
  return (value: number, fieldName: string): ValidationError | null => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return {
        field: fieldName,
        message: customMessage || `${fieldName}は数値である必要があります`,
        code: 'INVALID_NUMBER',
      };
    }
    
    if (min !== undefined && value < min) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.MIN_VALUE.replace('{field}', fieldName).replace('{min}', min.toString()),
        code: 'MIN_VALUE',
      };
    }
    
    if (max !== undefined && value > max) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.MAX_VALUE.replace('{field}', fieldName).replace('{max}', max.toString()),
        code: 'MAX_VALUE',
      };
    }
    
    return null;
  };
};

// 正の数値バリデーター
export const positiveNumber = (customMessage?: string): Validator<number> => {
  return (value: number, fieldName: string): ValidationError | null => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.POSITIVE_NUMBER.replace('{field}', fieldName),
        code: 'POSITIVE_NUMBER',
      };
    }
    return null;
  };
};

// 文字列長バリデーター
export const string = (maxLength?: number, customMessage?: string): Validator<string> => {
  return (value: string, fieldName: string): ValidationError | null => {
    // null/undefinedは許可する（オプショナルフィールド用）
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value !== 'string') {
      return {
        field: fieldName,
        message: customMessage || `${fieldName}は文字列である必要があります`,
        code: 'INVALID_STRING',
      };
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.MAX_LENGTH.replace('{field}', fieldName).replace('{max}', maxLength.toString()),
        code: 'MAX_LENGTH',
      };
    }
    
    return null;
  };
};

// 日付バリデーター
export const date = (minDate?: Date, customMessage?: string): Validator<Date | string> => {
  return (value: Date | string, fieldName: string): ValidationError | null => {
    const dateValue = typeof value === 'string' ? new Date(value) : value;
    
    if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.INVALID_DATE.replace('{field}', fieldName),
        code: 'INVALID_DATE',
      };
    }
    
    if (minDate && dateValue < minDate) {
      return {
        field: fieldName,
        message: customMessage || `${fieldName}は${minDate.toISOString().split('T')[0]}以降である必要があります`,
        code: 'MIN_DATE',
      };
    }
    
    return null;
  };
};

// Enumバリデーター
export const enumValidator = <T extends string | number>(allowedValues: readonly T[], customMessage?: string): Validator<T> => {
  return (value: T, fieldName: string): ValidationError | null => {
    if (!allowedValues.includes(value)) {
      return {
        field: fieldName,
        message: customMessage || ERROR_MESSAGES.INVALID_ENUM.replace('{field}', fieldName).replace('{values}', allowedValues.join(', ')),
        code: 'INVALID_ENUM',
      };
    }
    return null;
  };
};

// バリデーター合成関数
export const compose = <T>(...validators: Validator<T>[]): Validator<T> => {
  return (value: T, fieldName: string): ValidationError | null => {
    for (const validator of validators) {
      const error = validator(value, fieldName);
      if (error) {
        return error;
      }
    }
    return null;
  };
};

// オブジェクトバリデーション関数
export const validateObject = <T extends Record<string, unknown>>(
  data: T,
  rules: Partial<Record<keyof T, Validator<T[keyof T]> | Validator<T[keyof T]>[]>>
): ValidationResult<T> => {
  const errors: ValidationError[] = [];
  
  for (const [field, rule] of Object.entries(rules) as [keyof T, Validator<T[keyof T]> | Validator<T[keyof T]>[]][]) {
    const value = data[field];
    const validators = Array.isArray(rule) ? rule : [rule];
    
    for (const validator of validators) {
      const error = validator(value, String(field));
      if (error) {
        errors.push(error);
        break; // 最初のエラーで次のフィールドへ
      }
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data };
};

// 便利なプリセットバリデーター
export const validators = {
  // 金額バリデーター（必須 + 正の数 + 上限チェック）
  amount: compose(
    required<number>(),
    positiveNumber(),
    numeric(VALIDATION_LIMITS.MIN_AMOUNT, VALIDATION_LIMITS.MAX_AMOUNT)
  ),
  
  // 名前バリデーター（必須 + 文字列長）
  name: compose(
    required<string>(),
    string(VALIDATION_LIMITS.MAX_NAME_LENGTH)
  ),
  
  // 説明バリデーター（オプショナル + 文字列長）
  description: string(VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH),
  
  // 日付バリデーター（必須 + 最小日付）
  date: compose(
    required<Date | string>(),
    date(VALIDATION_LIMITS.MIN_DATE)
  ),
} as const;