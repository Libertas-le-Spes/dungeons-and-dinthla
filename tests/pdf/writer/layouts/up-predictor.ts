export function withUpPredictor(rows: Buffer[]): Buffer {
  const encoded: Buffer[] = [];
  let above: Buffer = Buffer.alloc(0);
  for (const row of rows) {
    const aboveRow = rowOrZeros(above, row.length);
    const tagged = Buffer.alloc(row.length + 1);
    tagged.writeUInt8(2, 0);
    for (let column = 0; column < row.length; column += 1) tagged.writeUInt8((row.readUInt8(column) - aboveRow.readUInt8(column)) & 255, column + 1);
    encoded.push(tagged);
    above = row;
  }
  return Buffer.concat(encoded);
}

function rowOrZeros(above: Buffer, length: number): Buffer {
  if (above.length === length) return above;
  return Buffer.alloc(length);
}
