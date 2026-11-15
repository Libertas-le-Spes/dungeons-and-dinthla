import type { SessionNote } from "../../campaign/record/campaign";

const COMMENT_MARK = "%%";
const FENCE_OPENING = /^\s*(```|~~~)/;
const INLINE_CODE = /`[^`]*`/g;

interface Stripped {
  text: string;
  commented: boolean;
}

function withoutComments({ text, commented }: Stripped): Stripped {
  let kept = "";
  let inside = commented;
  let at = 0;
  while (at < text.length) {
    const mark = text.indexOf(COMMENT_MARK, at);
    if (mark === -1) {
      if (!inside) kept += text.slice(at);
      break;
    }
    if (!inside) kept += text.slice(at, mark);
    inside = !inside;
    at = mark + COMMENT_MARK.length;
  }
  return { text: kept, commented: inside };
}

export function visibleLinesOf(session: SessionNote): string[] {
  const visible: string[] = [];
  let fence: string | null = null;
  let commented = false;
  for (const line of session.text.split("\n").slice(session.firstLine)) {
    if (fence !== null) {
      if (line.trim().startsWith(fence)) fence = null;
      visible.push("");
      continue;
    }
    const opening = FENCE_OPENING.exec(line);
    if (opening !== null && !commented) {
      fence = String(opening[1]);
      visible.push("");
      continue;
    }
    const stripped = withoutComments({ text: line, commented });
    commented = stripped.commented;
    visible.push(stripped.text.replace(INLINE_CODE, ""));
  }
  return visible;
}
