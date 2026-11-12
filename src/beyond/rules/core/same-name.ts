export function normal(name: string): string {
  return name.trim().toLowerCase();
}

export function sameName(first: string, second: string): boolean {
  return normal(first) === normal(second);
}
