import { hasStrayFormatCharacter } from "./format-characters";

export const BAD_NAME = `A name can't hold any of \\ / : * ? " < > | # ^ [ ] or a control character or an invisible formatting character other than the joiners and tags inside emoji, or start or end with a dot or a space.`;
export const RESERVED_NAME =
  "CON, PRN, AUX, NUL, CONIN$, CONOUT$, COM0 to COM9 and LPT0 to LPT9, with COM¹ to COM³ and LPT¹ to LPT³, can't name a note on Windows, even with more after a dot.";
export const LONG_NAME = "That name is too long for a note's file.";

const NOT_IN_A_NAME = /[\\/:*?"<>|#^[\]\u0000-\u001f\u007f]|^[. ]|[. ]$/u;
const RESERVED_ON_WINDOWS = /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;
const MOST_FILE_NAME_BYTES = 255;

export function refusalForFileName(name: string): string | null {
  if (NOT_IN_A_NAME.test(name)) return BAD_NAME;
  if (hasStrayFormatCharacter(name)) return BAD_NAME;
  if (RESERVED_ON_WINDOWS.test(name)) return RESERVED_NAME;
  if (new TextEncoder().encode(`${name}.md`).length > MOST_FILE_NAME_BYTES) return LONG_NAME;
  return null;
}
