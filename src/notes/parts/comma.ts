const PART_BETWEEN_COMMAS = /(?:\[\[[^[\]]*\]\]|\d,(?=\d)|[^,])+/g;

export function partsBetweenCommas(text: string): string[] {
  return [...text.matchAll(PART_BETWEEN_COMMAS)].map(([part]) => part);
}
