export interface KeptKind {
  readonly start: string;
  readonly heading: string;
  messageOf(session: string, keptAt: string): string;
}
