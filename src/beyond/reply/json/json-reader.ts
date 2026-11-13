import type { Cap } from "../../shape/cap";
import { refuseAbove } from "../../shape/refuse-above";
import { needsList, needsObject, needsText } from "../common/reply-refusals";

function isPlainObject(value: unknown): value is object {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  return !Array.isArray(value);
}

function readerOf(value: unknown): JsonReader {
  return JsonReader.of(value);
}

export class JsonReader {
  private constructor(private readonly value: unknown) {}

  static of(value: unknown): JsonReader {
    return new JsonReader(value);
  }

  hasKey(key: string): boolean {
    return this.valueAt(key) !== undefined;
  }

  holdsNothingAt(key: string): boolean {
    const found = this.valueAt(key);
    return found === undefined || found === null;
  }

  isNullAt(key: string): boolean {
    return this.valueAt(key) === null;
  }

  isTrueAt(key: string): boolean {
    return this.valueAt(key) === true;
  }

  textAt(key: string): string {
    const found = this.valueAt(key);
    if (typeof found !== "string") throw needsText(key);
    return found;
  }

  numberAt(key: string): number | null {
    const found = this.valueAt(key);
    if (typeof found !== "number") return null;
    if (!Number.isFinite(found)) return null;
    return found;
  }

  readerAt(key: string): JsonReader {
    const found = this.valueAt(key);
    if (!isPlainObject(found)) throw needsObject(key);
    return JsonReader.of(found);
  }

  listAt(key: string, cap: Cap): readonly JsonReader[] {
    const found = this.valueAt(key);
    if (!Array.isArray(found)) throw needsList(key);
    refuseAbove(cap, found.length);
    return found.map(readerOf);
  }

  private valueAt(key: string): unknown {
    if (!isPlainObject(this.value)) return undefined;
    const own = Object.getOwnPropertyDescriptor(this.value, key);
    if (own === undefined) return undefined;
    return own.value;
  }
}
