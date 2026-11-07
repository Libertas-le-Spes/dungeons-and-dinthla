export interface Match<T> {
  candidate: T;
  rest: string;
}

function restAfter(followUpText: string, earlierText: string): string | null {
  if (earlierText === "" || !followUpText.startsWith(earlierText)) return null;
  const afterEarlierText = followUpText.slice(earlierText.length).trimStart();
  if (!afterEarlierText.startsWith(":")) return null;
  return afterEarlierText.slice(1).trim();
}

export function findSubject<T>(followUpText: string, candidates: T[], textOf: (candidate: T) => string): Match<T> | null {
  let found: Match<T> | null = null;
  let foundLength = -1;
  for (const candidate of candidates) {
    const earlierText = textOf(candidate);
    const rest = restAfter(followUpText, earlierText);
    if (rest === null || earlierText.length <= foundLength) continue;
    found = { candidate, rest };
    foundLength = earlierText.length;
  }
  return found;
}
