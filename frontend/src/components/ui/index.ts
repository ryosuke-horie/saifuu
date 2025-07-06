/**
 * UI Components Barrel Export
 *
 * 汎用UIコンポーネントの統一エクスポートファイル
 * プロジェクト全体で使用される再利用可能なUIコンポーネントをまとめて管理
 *
 * 注意: 現在このファイルは使用されていません。
 * 実際のコンポーネントは個別にインポートして使用してください。
 *
 * 使用方法:
 * import { Dialog } from '@/components/ui/Dialog';
 *
 * 設計方針:
 * - 他のコンポーネントから簡単にインポートできるよう統一されたエクスポート
 * - コンポーネント追加時にはここに追加してアクセシビリティを向上
 * - 型定義も含めてエクスポートし、TypeScriptの恩恵を最大化
 */

export type { DialogProps } from "./Dialog";
// Dialog関連のエクスポート
export { Dialog } from "./Dialog";

// 将来追加予定のUIコンポーネント
// export { Button } from './Button';
// export { Input } from './Input';
// export { Modal } from './Modal';
// export { Tooltip } from './Tooltip';
// export { Card } from './Card';
// export { Badge } from './Badge';
