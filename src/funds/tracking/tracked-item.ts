export interface TrackedItem {
  readonly line: string;
  readonly key: string;
  readonly holderName: string;
}

export function trackedLineOf(holderText: string, written: string): string {
  return `$ ${holderText} ${written}`;
}
