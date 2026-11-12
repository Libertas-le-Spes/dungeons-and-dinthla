export interface InflatedChunks {
  next(): Promise<Uint8Array | null>;
  cancel(): Promise<void>;
}

export type StartInflating = (compressed: Uint8Array) => InflatedChunks;
