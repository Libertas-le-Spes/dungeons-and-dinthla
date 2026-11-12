export function sumWorking(terms: readonly string[], total: number): string {
  return `${terms.join(" + ")} = ${total}`;
}

export function reasonedWorking(terms: readonly string[], total: number, reason: string): string {
  return `${sumWorking(terms, total)}, ${reason}`;
}

export function withConditional(working: string, conditional: readonly string[]): string {
  if (conditional.length === 0) return working;
  return `${working}. Plus conditional bonuses I don't apply: ${conditional.join(", ")}`;
}
