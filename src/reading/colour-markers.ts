import { markerSpanOf } from "../notes/marker";

const BLOCKS_WITH_LINES = "p, li";
const NESTED_BLOCKS = new Set(["P", "UL", "OL", "DIV", "BLOCKQUOTE", "PRE"]);
const LIST_DECORATIONS = ".list-bullet, .list-collapse-indicator";
const UNREAD_SURROUNDINGS = "blockquote, .callout";

function isReadListItem(item: Element): boolean {
  if (item.classList.contains("task-list-item")) return false;
  return item.parentElement?.tagName !== "OL";
}

function isLineBlock(block: Element): boolean {
  if (block.closest(UNREAD_SURROUNDINGS) !== null) return false;
  if (block.tagName === "LI") return isReadListItem(block);
  const listItem = block.parentElement;
  if (listItem?.tagName === "LI") return isReadListItem(listItem);
  return true;
}

function isListDecoration(node: Node): boolean {
  return node.nodeType === node.ELEMENT_NODE && (node as Element).matches(LIST_DECORATIONS);
}

function addText(lines: Node[][], text: Text): void {
  let rest = text;
  let newline = rest.data.indexOf("\n");
  while (newline !== -1 && newline < rest.data.length - 1) {
    const next = rest.splitText(newline + 1);
    lines.at(-1)!.push(rest);
    lines.push([]);
    rest = next;
    newline = rest.data.indexOf("\n");
  }
  lines.at(-1)!.push(rest);
}

function linesOf(block: Element): Node[][] {
  const lines: Node[][] = [[]];
  for (const node of Array.from(block.childNodes)) {
    if (NESTED_BLOCKS.has(node.nodeName)) break;
    if (isListDecoration(node)) continue;
    if (node.nodeName === "BR") lines.push([]);
    else if (node.nodeType === node.TEXT_NODE) addText(lines, node as Text);
    else lines.at(-1)!.push(node);
  }
  return lines;
}

function colourLine(nodes: Node[]): void {
  const [first] = nodes;
  if (first === undefined || first.nodeType !== first.TEXT_NODE) return;
  const text = nodes.map((node) => node.textContent).join("");
  const span = markerSpanOf(text);
  const firstText = first as Text;
  if (span === null || span.end > firstText.data.length) return;
  const glyph = firstText.splitText(span.start);
  glyph.splitText(span.end - span.start);
  const mark = firstText.ownerDocument.createElement("span");
  mark.className = `dd-tokens dd-marker dd-marker-${span.marker}`;
  glyph.replaceWith(mark);
  mark.append(glyph);
}

export function colourMarkers(root: HTMLElement): void {
  const blocks = Array.from(root.querySelectorAll(BLOCKS_WITH_LINES)).filter(isLineBlock);
  for (const block of blocks) {
    for (const line of linesOf(block)) colourLine(line);
  }
}
