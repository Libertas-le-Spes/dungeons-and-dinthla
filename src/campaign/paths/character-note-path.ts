const NOTE_EXTENSION = ".md";
const SLASH = "/";

export function isCharacterNotePath(path: string, charactersFolder: string): boolean {
  const inside = `${charactersFolder}${SLASH}`;
  if (!path.startsWith(inside)) return false;
  const rest = path.slice(inside.length);
  return !rest.includes(SLASH) && rest.endsWith(NOTE_EXTENSION);
}
