const LINK = /\[\[([^\]]+)\]\]/g;

export function findLinks(text: string): string[] {
  return [...text.matchAll(LINK)].map(([, name = ""]) => name);
}

export function unlink(text: string): string {
  return text.replace(LINK, "$1");
}
