import { deflateSync } from "node:zlib";
import { bytesOf } from "../object-bytes";
import { PdfOutput } from "../pdf-output";
import { byValue, PdfWriter } from "../pdf-writer";
import { HEADER } from "./classic-layout";
import { withUpPredictor } from "./up-predictor";

export interface StreamedOptions {
  packed: number[];
  predictor: boolean;
  root: number;
  trailerExtra: string;
  objectStreamExtra: string;
  junkBefore: string;
  objectStreamText: RawObjectStream | null;
}

export interface RawObjectStream {
  count: number;
  first: number;
  text: string;
}

const ROW_BYTES = 7;

function rawObjectStreamBody(raw: RawObjectStream, extra: string): Buffer {
  const data = deflateSync(bytesOf(raw.text));
  return Buffer.concat([bytesOf(`<< /Type /ObjStm /N ${raw.count} /First ${raw.first} /Filter /FlateDecode ${extra} /Length ${data.length} >>\nstream\n`), data, bytesOf("\nendstream")]);
}

function objectStreamBody(writer: PdfWriter, packed: number[], extra: string): Buffer {
  let header = "";
  let bodies = "";
  for (const number of packed) {
    header += `${number} ${bodies.length} `;
    bodies += writer.bodyOf(number).toString("latin1") + "\n";
  }
  const data = deflateSync(bytesOf(header + bodies));
  return Buffer.concat([bytesOf(`<< /Type /ObjStm /N ${packed.length} /First ${header.length} /Filter /FlateDecode ${extra} /Length ${data.length} >>\nstream\n`), data, bytesOf("\nendstream")]);
}

function rowOf(number: number, offsets: Map<number, number>, packed: number[], containerNumber: number): Buffer {
  const row = Buffer.alloc(ROW_BYTES);
  const offset = offsets.get(number);
  if (offset !== undefined) {
    row.writeUInt8(1, 0);
    row.writeUInt32BE(offset, 1);
    return row;
  }
  const index = packed.indexOf(number);
  if (index < 0) return row;
  row.writeUInt8(2, 0);
  row.writeUInt32BE(containerNumber, 1);
  row.writeUInt16BE(index, 5);
  return row;
}

function predictorParameters(options: StreamedOptions): string {
  if (!options.predictor) return "";
  return `/DecodeParms << /Predictor 12 /Columns ${ROW_BYTES} >>`;
}

export function streamedPdf(writer: PdfWriter, given: Partial<StreamedOptions>): Buffer {
  const options: StreamedOptions = { packed: [], predictor: false, root: 1, trailerExtra: "", objectStreamExtra: "", junkBefore: "", objectStreamText: null, ...given };
  const packed = [...options.packed].sort(byValue);
  const containerNumber = writer.highestNumber() + 1;
  const xrefNumber = containerNumber + 1;
  const output = new PdfOutput();
  output.put(options.junkBefore);
  output.startFileHere();
  output.put(HEADER);
  const offsets = new Map<number, number>();
  for (const number of writer.numbers()) {
    if (packed.includes(number)) continue;
    offsets.set(number, output.put(`${number} 0 obj\n`));
    output.put(writer.bodyOf(number));
    output.put("\nendobj\n");
  }
  offsets.set(containerNumber, output.put(`${containerNumber} 0 obj\n`));
  output.put(chosenObjectStream(writer, packed, options));
  output.put("\nendobj\n");
  const xrefOffset = output.put(`${xrefNumber} 0 obj\n`);
  offsets.set(xrefNumber, xrefOffset);
  const rows: Buffer[] = [];
  for (let number = 0; number <= xrefNumber; number += 1) rows.push(rowOf(number, offsets, packed, containerNumber));
  const data = deflateSync(rowsBytes(rows, options));
  const dictionary = `/Type /XRef /Size ${xrefNumber + 1} /W [1 4 2] /Root ${options.root} 0 R /Filter /FlateDecode ${predictorParameters(options)} ${options.trailerExtra}`;
  output.put(Buffer.concat([bytesOf(`<< ${dictionary} /Length ${data.length} >>\nstream\n`), data, bytesOf("\nendstream\nendobj\n")]));
  output.put(`startxref\n${xrefOffset}\n%%EOF\n`);
  return output.toBuffer();
}

function rowsBytes(rows: Buffer[], options: StreamedOptions): Buffer {
  if (options.predictor) return withUpPredictor(rows);
  return Buffer.concat(rows);
}

function chosenObjectStream(writer: PdfWriter, packed: number[], options: StreamedOptions): Buffer {
  if (options.objectStreamText !== null) return rawObjectStreamBody(options.objectStreamText, options.objectStreamExtra);
  return objectStreamBody(writer, packed, options.objectStreamExtra);
}
