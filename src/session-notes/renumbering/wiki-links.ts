const LINK_OR_CODE = /(`[^`\n]*`)|(!?\[\[)([^\]|#^\n]*)([^\]\n]*\]\])/g;

export type NewTarget = (target: string) => string | null;

type LinkMatch = [match: string, code: string | undefined, opener: string, target: string, rest: string];

function rewrittenBy(newTarget: NewTarget): (...found: LinkMatch) => string {
  function rewritten(...found: LinkMatch): string {
    const [match, code, opener, target, rest] = found;
    if (code !== undefined) return match;
    const replacement = newTarget(target);
    if (replacement === null) return match;
    return `${opener}${replacement}${rest}`;
  }
  return rewritten;
}

function maskedLink(...found: LinkMatch): string {
  const [match, code, opener, , rest] = found;
  if (code !== undefined) return match;
  return `${opener}${rest}`;
}

function collectingInto(targets: string[]): (...found: LinkMatch) => string {
  function collected(...found: LinkMatch): string {
    const [match, code, , target] = found;
    if (code === undefined) targets.push(target);
    return match;
  }
  return collected;
}

export function lineWithTargetsReplaced(line: string, newTarget: NewTarget): string {
  return line.replace(LINK_OR_CODE, rewrittenBy(newTarget));
}

export function lineWithTargetsMasked(line: string): string {
  return line.replace(LINK_OR_CODE, maskedLink);
}

export function targetsOf(line: string): string[] {
  const targets: string[] = [];
  line.replace(LINK_OR_CODE, collectingInto(targets));
  return targets;
}
