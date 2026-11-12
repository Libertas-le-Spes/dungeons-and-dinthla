import { bytesOf, padded } from "../object-bytes";

function lastStartxref(base: Buffer): number {
  let last = 0;
  for (const match of base.toString("latin1").matchAll(/startxref\n(?<offset>\d+)/g)) last = Number(match.groups?.offset);
  return last;
}

export function withUpdate(base: Buffer, number: number, body: string, size: number): Buffer {
  const objectOffset = base.length;
  const object = `${number} 0 obj\n${body}\nendobj\n`;
  const tableOffset = objectOffset + object.length;
  const table = `xref\n${number} 1\n${padded(objectOffset, 10)} 00000 n \ntrailer\n<< /Size ${size} /Root 1 0 R /Prev ${lastStartxref(base)} >>\nstartxref\n${tableOffset}\n%%EOF\n`;
  return Buffer.concat([base, bytesOf(object + table)]);
}
