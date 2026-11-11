export interface SeenTab<T> {
  tab: T;
  shown: boolean;
  activeTime: number;
}

function laterOf<T>(best: SeenTab<T> | null, candidate: SeenTab<T>): SeenTab<T> {
  if (best === null || candidate.activeTime > best.activeTime) return candidate;
  return best;
}

function latestOf<T>(tabs: SeenTab<T>[]): SeenTab<T> | null {
  let best: SeenTab<T> | null = null;
  for (const candidate of tabs) best = laterOf(best, candidate);
  return best;
}

function isShown<T>(seen: SeenTab<T>): boolean {
  return seen.shown;
}

export function mostRecentTab<T>(tabs: SeenTab<T>[]): T | null {
  const inView = latestOf(tabs.filter(isShown));
  if (inView !== null) return inView.tab;
  const anyTab = latestOf(tabs);
  if (anyTab === null) return null;
  return anyTab.tab;
}
