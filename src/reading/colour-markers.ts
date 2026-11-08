import { markerSpanOf } from "../notes/marker";

const BLOCKS_WITH_LINES = "p, li";
const NESTED_BLOCKS = new Set(["P", "UL", "OL", "DIV", "BLOCKQUOTE", "PRE"]);

function isLineBlock(block: Element): boolean {
  if (block.tagName !== "LI") return true;
  if (block.classList.contains("task-list-item")) return false;
  return block.parentElement?.tagName !== "OL";
}

function linesOf(block: Element): Node[][] {
  const lines: Node[][] = [[]];
  for (const node of Array.from(block.childNodes)) {
    if (NESTED_BLOCKS.has(node.nodeName)) break;
    if (node.nodeName === "BR") {
      lines.push([]);
      continue;
    }
    lines.at(-1)!.push(node);
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
  const rest = firstText.splitText(span.start);
  rest.splitText(span.end - span.start);
  const mark = firstText.ownerDocument.createElement("span");
  mark.className = `dd-tokens dd-marker dd-marker-${span.marker}`;
  rest.replaceWith(mark);
  mark.append(rest);
}

export function colourMarkers(root: HTMLElement): void {
  const blocks = [root, ...Array.from(root.querySelectorAll(BLOCKS_WITH_LINES))].filter(
    (block) => block.matches(BLOCKS_WITH_LINES) && isLineBlock(block),
  );
  for (const block of blocks) {
    for (const line of linesOf(block)) colourLine(line);
  }
}
