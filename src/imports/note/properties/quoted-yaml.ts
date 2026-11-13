const BACKSLASH_OR_QUOTE = /[\\"]/g;

function withBackslash(character: string): string {
  return `\\${character}`;
}

export function quotedYamlOf(text: string): string {
  return `"${text.replace(BACKSLASH_OR_QUOTE, withBackslash)}"`;
}
