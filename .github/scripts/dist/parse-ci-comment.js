// parse-ci-comment.ts
function parseCIComment(comment) {
  const validTargets = ["api", "frontend"];
  const targets = /* @__PURE__ */ new Set();
  if (!comment || typeof comment !== "string") {
    return {
      isValid: false,
      targets: []
    };
  }
  const lines = comment.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
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
export {
  parseCIComment
};
//# sourceMappingURL=parse-ci-comment.js.map
