export interface Subject<T> {
  subject: T;
  rest: string;
}

function restAfter(text: string, title: string): string | null {
  if (title === "" || !text.startsWith(title)) return null;
  const afterTitle = text.slice(title.length).trimStart();
  if (!afterTitle.startsWith(":")) return null;
  return afterTitle.slice(1).trim();
}

export function findSubject<T>(text: string, candidates: T[], titleOf: (candidate: T) => string): Subject<T> | null {
  let found: Subject<T> | null = null;
  let foundLength = -1;
  for (const candidate of candidates) {
    const title = titleOf(candidate);
    const rest = restAfter(text, title);
    if (rest === null || title.length <= foundLength) continue;
    found = { subject: candidate, rest };
    foundLength = title.length;
  }
  return found;
}
