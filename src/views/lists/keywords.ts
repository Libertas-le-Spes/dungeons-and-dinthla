export function keywordsOf(filter: string): string[] {
  return filter.toLowerCase().split(/\s+/).filter((word) => word !== "");
}
