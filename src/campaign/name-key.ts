const IGNORABLE = /\p{Default_Ignorable_Code_Point}/gu;

export function nameKeyOf(name: string): string {
  const visible = name.normalize("NFC").replace(IGNORABLE, "");
  return visible.toLowerCase();
}
