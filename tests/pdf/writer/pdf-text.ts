export function literal(text: string): string {
  return `(${text})`;
}

export function utf16Hex(text: string): string {
  let hex = "FEFF";
  for (const unit of text) hex += unit.charCodeAt(0).toString(16).padStart(4, "0");
  return `<${hex}>`;
}
