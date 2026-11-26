import { crc32, deflateRawSync } from "node:zlib";

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;
const ZIP_VERSION = 20;
const UTF8_NAMES = 0x0800;
const DEFLATED = 8;
const MIDDAY_TIME = 12 << 11;
const NEW_YEAR_2026 = ((2026 - 1980) << 9) | (1 << 5) | 1;

interface Entry {
  readonly name: Buffer;
  readonly crc: number;
  readonly size: number;
  readonly packed: Buffer;
  readonly offset: number;
}

function localHeaderOf(entry: Entry): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(LOCAL_HEADER, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(UTF8_NAMES, 6);
  header.writeUInt16LE(DEFLATED, 8);
  header.writeUInt16LE(MIDDAY_TIME, 10);
  header.writeUInt16LE(NEW_YEAR_2026, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.packed.length, 18);
  header.writeUInt32LE(entry.size, 22);
  header.writeUInt16LE(entry.name.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function centralHeaderOf(entry: Entry): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(CENTRAL_HEADER, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(ZIP_VERSION, 6);
  header.writeUInt16LE(UTF8_NAMES, 8);
  header.writeUInt16LE(DEFLATED, 10);
  header.writeUInt16LE(MIDDAY_TIME, 12);
  header.writeUInt16LE(NEW_YEAR_2026, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.packed.length, 20);
  header.writeUInt32LE(entry.size, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt32LE(entry.offset, 42);
  return header;
}

export class ZipWriter {
  private readonly entries: Entry[] = [];
  private readonly parts: Buffer[] = [];
  private written = 0;

  add(path: string, bytes: Buffer): void {
    const entry = { name: Buffer.from(path, "utf8"), crc: crc32(bytes), size: bytes.length, packed: deflateRawSync(bytes), offset: this.written };
    this.entries.push(entry);
    this.write(localHeaderOf(entry), entry.name, entry.packed);
  }

  bytes(): Buffer {
    const centralStart = this.written;
    for (const entry of this.entries) this.write(centralHeaderOf(entry), entry.name);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(END_OF_CENTRAL, 0);
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(this.written - centralStart, 12);
    end.writeUInt32LE(centralStart, 16);
    this.write(end);
    return Buffer.concat(this.parts);
  }

  private write(...parts: Buffer[]): void {
    for (const part of parts) {
      this.parts.push(part);
      this.written += part.length;
    }
  }
}
