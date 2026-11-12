export const NOTE_ENDING = ".md";

const MARKDOWN_ENDING = /\.md$/;

export function noteNameOf(path: string): string {
  const fileName = path.substring(path.lastIndexOf("/") + 1);
  return fileName.replace(MARKDOWN_ENDING, "");
}

export function markdownEndingOf(path: string): string {
  if (path.endsWith(NOTE_ENDING)) return NOTE_ENDING;
  return "";
}

export function foldersPartOf(path: string): string {
  const names = path.split("/");
  names.pop();
  return names.map((name) => `${name}/`).join("");
}
