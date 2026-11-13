const LINE_BREAKS = /\r\n|[\r\u0085\u2028\u2029]/g;
const TABS = /\t/g;
const SPACES = /\p{Zs}/gu;
const HIDDEN_BUT_NEW_LINE = /(?!\n)[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Default_Ignorable_Code_Point}]/gu;
export const NEW_LINE = "\n";
const SPACE = " ";

function withPlainBreaksAndSpaces(text: string): string {
  const broken = text.replace(LINE_BREAKS, NEW_LINE);
  const untabbed = broken.replace(TABS, SPACE);
  return untabbed.replace(SPACES, SPACE);
}

export function cleanTextOf(text: string): string {
  return withPlainBreaksAndSpaces(text).replace(HIDDEN_BUT_NEW_LINE, "");
}
