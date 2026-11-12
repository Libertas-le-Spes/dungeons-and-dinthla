export interface TextEncoding {
  matches(bytes: Uint8Array): boolean;
  decode(bytes: Uint8Array): string;
}
