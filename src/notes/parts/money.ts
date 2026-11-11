export function formatMoney(copper: number): string {
  const amount = Math.abs(copper);
  const gold = Math.floor(amount / 100);
  const silver = Math.floor((amount % 100) / 10);
  const rest = amount % 10;
  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold.toLocaleString("en")} gp`);
  if (silver > 0) parts.push(`${silver} sp`);
  if (rest > 0) parts.push(`${rest} cp`);
  if (parts.length === 0) parts.push("0 gp");
  const written = parts.join(" ");
  if (copper < 0) return `−${written}`;
  return written;
}
