export function pathOf(file: unknown): string | null {
  if (typeof file !== "object" || file === null) return null;
  if (!("path" in file) || typeof file.path !== "string") return null;
  return file.path;
}
