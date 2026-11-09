const IGNORABLE = /\p{Default_Ignorable_Code_Point}/gu;
const ANY_SPACE = /\p{Zs}/gu;

export function nameKeyOf(name: string): string {
  const visible = name.replace(IGNORABLE, "");
  const plainSpaced = visible.replace(ANY_SPACE, " ");
  const composed = plainSpaced.normalize("NFC");
  return composed.toLowerCase();
}
