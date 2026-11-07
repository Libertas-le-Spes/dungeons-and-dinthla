const LINK = /\[\[([^\]]+)\]\]/g;

function targetOf(inside: string): string {
  return inside.replace(/[|#].*$/, "").trim();
}

function shownTextOf(inside: string): string {
  const bar = inside.indexOf("|");
  if (bar === -1) return targetOf(inside);
  return inside.slice(bar + 1).trim();
}

export function findLinks(text: string): string[] {
  const targets: string[] = [];
  for (const [, inside] of text.matchAll(LINK)) {
    if (inside !== undefined) targets.push(targetOf(inside));
  }
  return targets;
}

export function removeFirstLink(text: string): string {
  return text.replace(new RegExp(LINK.source), "");
}

export function unlink(text: string): string {
  return text.replace(LINK, (_link, inside: string) => shownTextOf(inside));
}
