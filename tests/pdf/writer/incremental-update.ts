import { bytesOf, padded } from "./object-bytes";

function lastStartxref(base: Buffer): number {
  const text = base.toString("latin1");
  const at = text.lastIndexOf("startxref");
  return Number(text.slice(at + "startxref".length).trim().split("\n")[0]);
}

export function withUpdate(base: Buffer, number: number, body: string, size: number): Buffer {
  const objectOffset = base.length;
  const object = `${number} 0 obj\n${body}\nendobj\n`;
  const tableOffset = objectOffset + object.length;
  const table = `xref\n${number} 1\n${padded(objectOffset, 10)} 00000 n \ntrailer\n<< /Size ${size} /Root 1 0 R /Prev ${lastStartxref(base)} >>\nstartxref\n${tableOffset}\n%%EOF\n`;
  return Buffer.concat([base, bytesOf(object + table)]);
}
