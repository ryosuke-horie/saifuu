export interface ParseResult {
  isValid: boolean;
  targets: string[];
}

export function parseCIComment(comment: string): ParseResult {
  const validTargets = ['api', 'frontend'];
  const targets = new Set<string>();
  
  // null, undefined, または非文字列の場合は空の結果を返す
  if (!comment || typeof comment !== 'string') {
    return {
      isValid: false,
      targets: []
    };
  }
  
  // コメントを行ごとに分割して処理
  const lines = comment.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // /ci <target> パターンを探す
    const match = trimmedLine.match(/^\/ci\s+(\w+)$/);
    if (match) {
      const target = match[1];
      if (validTargets.includes(target)) {
        targets.add(target);
      }
    }
  }
  
  return {
    isValid: targets.size > 0,
    targets: Array.from(targets)
  };
}