const SPACES = /\s+/g;

export function itemKeyOf(name: string): string {
  return name.replace(SPACES, " ").trim().toLowerCase();
}
