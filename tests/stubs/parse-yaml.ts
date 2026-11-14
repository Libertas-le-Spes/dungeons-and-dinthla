const KEY_LINE = /^([^\s#:-][^:]*):(?:\s+(.*)|)$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
const CONTINUATION = /^(\s+|-\s)/;

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

function quotedValue(first: string, queue: string[], key: string): string {
  let value = first;
  let end = closedQuote(value);
  while (end === -1 && queue.length > 0) {
    value = `${value} ${String(queue.shift()).trim()}`;
    end = closedQuote(value);
  }
  if (end === -1) throw new Error(`Unterminated quote for ${key}`);
  return unescaped(value.slice(1, end));
}

function continuationOf(queue: string[]): { items: string[]; isList: boolean } {
  const items: string[] = [];
  let isList = false;
  while (queue.length > 0 && CONTINUATION.test(String(queue[0]))) {
    const line = String(queue.shift());
    if (line.startsWith("-")) isList = true;
    items.push(line.replace(/^\s*-?\s*/, "").trim());
  }
  return { items, isList };
}

export function parseYaml(yaml: string): unknown {
  const queue = yaml.split(/\r?\n/).map((line) => line.replace(/\r$/, ""));
  const found: Record<string, unknown> = {};
  for (let line = queue.shift(); line !== undefined; line = queue.shift()) {
    if (line.trim() === "" || line.startsWith("#")) continue;
    const match = KEY_LINE.exec(line);
    if (match === null) throw new Error(`Not a property: ${line}`);
    const key = String(match[1]).trim();
    let value = "";
    if (match[2] !== undefined) value = match[2].trim();
    if (value.startsWith('"')) {
      found[key] = quotedValue(value, queue, key);
      continue;
    }
    const { items, isList } = continuationOf(queue);
    if (isList) found[key] = items;
    else if (items.length > 0) found[key] = [value, ...items].join(" ");
    else found[key] = scalarOf(value);
  }
  return found;
}
