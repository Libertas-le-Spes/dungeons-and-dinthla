import { codesFoundIn, WEB_ADDRESSES, type NetworkCode } from "./network-code.ts";

const DATA_URL = /url\(\s*(["']?)data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+\1\s*\)/gi;

export const STYLE_NETWORK_CODE: NetworkCode[] = [
  { name: "a url( that is not a base64 data URL", pattern: /url\(/i },
  { name: "@import", pattern: /@import/i },
  { name: "an escaped letter or sign", pattern: /\\(?:[^0-9a-f]|0*[0-7]?[0-9a-f](?![0-9a-f]))/i },
  ...WEB_ADDRESSES,
];

function withoutDataUrls(text: string): string {
  return text.replaceAll(DATA_URL, "");
}

export function styleNetworkCodeIn(text: string): string[] {
  return codesFoundIn(STYLE_NETWORK_CODE, withoutDataUrls(text));
}
