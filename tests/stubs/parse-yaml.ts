const KEY_LINE = /^([^\s#:-][^:]*):(?:\s+(.*)|)$/;
const NUMBER = /^-?\d+(\.\d+)?$/;

function scalarOf(written: string): unknown {
  const text = written.trim();
  if (text === "" || text === "null" || text === "~") return null;
  if (NUMBER.test(text)) return Number(text);
  if (text.startsWith("[") && text.endsWith("]")) return text.slice(1, -1).split(",").map((part) => part.trim());
  if (text.startsWith("'") && text.endsWith("'") && text.length > 1) return text.slice(1, -1);
  return text;
}

function closedQuote(text: string): number {
  for (let position = 1; position < text.length; position += 1) {
    if (text.charAt(position) === "\\") position += 1;
    else if (text.charAt(position) === '"') return position;
  }
  return -1;
}

function unescaped(text: string): string {
  return text.replace(/\\(["\\])/g, "$1");
}

export function parseYaml(yaml: string): unknown {
  const lines = yaml.split(/\r?\n/).map((line) => line.replace(/\r$/, ""));
  const found: Record<string, unknown> = {};
  let position = 0;
  while (position < lines.length) {
    const line = lines[position]!;
    position += 1;
    if (line.trim() === "" || line.startsWith("#")) continue;
    const match = KEY_LINE.exec(line);
    if (match === null) throw new Error(`Not a property: ${line}`);
    const key = match[1]!.trim();
    let value = "";
    if (match[2] !== undefined) value = match[2].trim();
    if (value.startsWith('"')) {
      let end = closedQuote(value);
      while (end === -1 && position < lines.length) {
        value = `${value} ${lines[position]!.trim()}`;
        position += 1;
        end = closedQuote(value);
      }
      if (end === -1) throw new Error(`Unterminated quote for ${key}`);
      found[key] = unescaped(value.slice(1, end));
      continue;
    }
    const items: string[] = [];
    let isList = false;
    while (position < lines.length && /^(\s+|-\s)/.test(lines[position]!)) {
      if (lines[position]!.startsWith("-")) isList = true;
      items.push(lines[position]!.replace(/^\s*-?\s*/, "").trim());
      position += 1;
    }
    if (isList) found[key] = items;
    else if (items.length > 0) found[key] = [value, ...items].join(" ");
    else found[key] = scalarOf(value);
  }
  return found;
}
