const FENCE = /^\s*(`{3,}|~{3,})/;
const COMMENT_MARK = "%%";

function commentMarksIn(line: string): number {
  return line.split(COMMENT_MARK).length - 1;
}

export function hiddenLines(text: string): Set<number> {
  const hidden = new Set<number>();
  let fence: string | null = null;
  let inComment = false;
  text.split("\n").forEach((line, index) => {
    const opening = FENCE.exec(line);
    if (fence !== null) {
      hidden.add(index);
      if (opening !== null && opening[1]!.startsWith(fence)) fence = null;
      return;
    }
    const marks = commentMarksIn(line);
    if (inComment || marks > 0) {
      hidden.add(index);
      if (marks % 2 === 1) inComment = !inComment;
      return;
    }
    if (opening === null) return;
    hidden.add(index);
    fence = opening[1]!;
  });
  return hidden;
}
