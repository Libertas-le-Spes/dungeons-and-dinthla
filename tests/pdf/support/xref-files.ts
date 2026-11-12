import { deflateSync } from "node:zlib";
import { readFileIndex, type FileIndex } from "../../../src/pdf/read-file-index";
import { testParts } from "../writer/zlib-chunks";

export function indexOf(bytes: Uint8Array): Promise<FileIndex> {
  return readFileIndex(bytes, testParts());
}

export function textFile(text: string): Buffer {
  return Buffer.from(text, "latin1");
}

export function rowOf(type: number, second: number, third: number): Buffer {
  const row = Buffer.alloc(7);
  row.writeUInt8(type, 0);
  row.writeUInt32BE(second, 1);
  row.writeUInt16BE(third, 5);
  return row;
}

export function xrefStreamFile(dictionary: string, data: Buffer, deflate: boolean): Buffer {
  const body = deflate ? deflateSync(data) : data;
  const filter = deflate ? "/Filter /FlateDecode" : "";
  const header = "%PDF-1.7\n";
  const object = `7 0 obj\n<< /Type /XRef ${dictionary} ${filter} /Length ${body.length} >>\nstream\n`;
  const after = `\nendstream\nendobj\nstartxref\n${header.length}\n%%EOF\n`;
  return Buffer.concat([Buffer.from(header + object, "latin1"), body, Buffer.from(after, "latin1")]);
}

export function classicEntries(count: number, mark: string): string {
  const line = `0000000000 00000 ${mark} \n`;
  return line.repeat(count);
}
