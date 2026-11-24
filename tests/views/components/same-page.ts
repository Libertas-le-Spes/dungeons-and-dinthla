export interface Shape {
  readonly tag: string;
  readonly attributes: Record<string, string>;
  readonly text: string;
  readonly children: readonly Shape[];
}

const TAB_IDS = /dd-tabs-\d+/g;

function ownText(el: Element): string {
  let text = "";
  for (const node of el.childNodes) {
    if (node.nodeType === 3) text += node.textContent;
  }
  return text;
}

export function shapeOf(el: Element): Shape {
  const attributes: Record<string, string> = {};
  for (const attribute of Array.from(el.attributes).sort((first, second) => first.name.localeCompare(second.name))) attributes[attribute.name] = attribute.value.replace(TAB_IDS, "dd-tabs-n");
  const children: Shape[] = [];
  for (const child of Array.from(el.children)) children.push(shapeOf(child));
  return { tag: el.tagName.toLowerCase(), attributes, text: ownText(el), children };
}
