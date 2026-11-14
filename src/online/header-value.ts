export function headerValue(headers: Record<string, string>, wanted: string): string {
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === wanted.toLowerCase()) return value;
  }
  return "";
}
