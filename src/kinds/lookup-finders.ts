export interface LookupFinders<Match> {
  question(keywords: string[]): Match[];
  quest(keywords: string[]): Match[];
  item(keywords: string[]): Match[];
}
