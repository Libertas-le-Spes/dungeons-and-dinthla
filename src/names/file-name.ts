import { hasStrayFormatCharacter } from "./format-characters";

export const BAD_NAME = `A name can't hold any of \\ / : * ? " < > | # ^ [ ] or a control character, a line break or an invisible character, or start or end with a dot or a space. Invisible joiners are allowed only inside emoji, and tag characters only in the flags of England, Scotland and Wales.`;
export const RESERVED_NAME =
  "CON, PRN, AUX, NUL, CONIN$, CONOUT$, COM0 to COM9 and LPT0 to LPT9, with COM¹ to COM³ and LPT¹ to LPT³, can't name a note on Windows, even with more after a dot.";
export const LONG_NAME = "That name is too long for a note's file.";

const NOT_IN_A_NAME = /[\\/:*?"<>|#^[\]\p{Cc}\u2028\u2029]|^[. ]/u;
const TRIMMED_BY_WINDOWS = /[. ]$/;
const RESERVED_ON_WINDOWS = /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;
const MOST_FILE_NAME_BYTES = 255;

export function isTrimmedByWindows(name: string): boolean {
  return TRIMMED_BY_WINDOWS.test(name);
}

export function refusalForFileName(name: string): string | null {
  if (NOT_IN_A_NAME.test(name) || isTrimmedByWindows(name)) return BAD_NAME;
  if (hasStrayFormatCharacter(name)) return BAD_NAME;
  if (RESERVED_ON_WINDOWS.test(name)) return RESERVED_NAME;
  if (new TextEncoder().encode(`${name}.md`).length > MOST_FILE_NAME_BYTES) return LONG_NAME;
  return null;
}
