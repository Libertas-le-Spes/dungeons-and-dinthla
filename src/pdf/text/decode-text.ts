import { hasPrefix } from "./byte-prefix";
import { codePointOfPdfDocCode } from "./pdf-doc-encoding";
import { unreadableText } from "./unreadable-text";
import { utf16TextOf } from "./utf16-text";

const UTF16_MARK = [0xfe, 0xff];
const UTF8_MARK = [0xef, 0xbb, 0xbf];

function decodeUtf16(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rest = bytes.byteLength - UTF16_MARK.length;
  if (rest % 2 !== 0) throw unreadableText();
  const units: number[] = [];
  for (let at = UTF16_MARK.length; at < bytes.byteLength; at += 2) units.push(view.getUint16(at, false));
  return utf16TextOf(units);
}

function decodePdfDoc(bytes: Uint8Array): string {
  let text = "";
  for (const code of bytes) {
    const point = codePointOfPdfDocCode(code);
    if (point === null) throw unreadableText();
    text += String.fromCharCode(point);
  }
  return text;
}

export function decodeText(bytes: Uint8Array): string {
  if (hasPrefix(bytes, UTF16_MARK)) return decodeUtf16(bytes);
  if (hasPrefix(bytes, UTF8_MARK)) throw unreadableText();
  return decodePdfDoc(bytes);
}
