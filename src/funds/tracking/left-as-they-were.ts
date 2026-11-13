export function withoutOne(signatures: readonly string[], unwanted: string): string[] | null {
  const position = signatures.indexOf(unwanted);
  if (position === -1) return null;
  const left = [...signatures];
  left.splice(position, 1);
  return left;
}

export function leftAsTheyWere(left: readonly string[], before: readonly string[]): boolean {
  let unmatched: string[] | null = [...before];
  for (const signature of left) {
    if (unmatched === null) return false;
    unmatched = withoutOne(unmatched, signature);
  }
  if (unmatched === null) return false;
  return unmatched.length <= 1;
}
