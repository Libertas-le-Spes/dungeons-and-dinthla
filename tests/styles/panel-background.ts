import { over, type Colour } from "./css-colour";
import { backgroundOf } from "./style-files";

const PLAIN = /^var\(--([\w-]+)\)$/;
const FLAT_GRADIENT = /^linear-gradient\(var\(--([\w-]+)\), var\(--([\w-]+)\)\)$/;

function topLevelLayers(value: string): string[] {
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  layers.push(current.trim());
  return layers;
}

function flatGradientToken(layer: string): string | null {
  const gradient = FLAT_GRADIENT.exec(layer);
  if (gradient === null) return null;
  if (gradient[1] !== gradient[2]) throw new Error(`The contrast test can't read the gradient ${layer}`);
  return gradient[1]!;
}

function tokenOfLayer(layer: string): string {
  const plain = PLAIN.exec(layer);
  if (plain !== null) return plain[1]!;
  const gradient = flatGradientToken(layer);
  if (gradient === null) throw new Error(`The contrast test can't read the background layer ${layer}`);
  return gradient;
}

export function panelOver(token: (name: string) => Colour, file: string, selector: string, picture: Colour): Colour {
  const background = backgroundOf(file, selector);
  if (background === null) throw new Error(`${selector} has no background in ${file}`);
  let behind = picture;
  for (const layer of topLevelLayers(background).reverse()) behind = over(token(tokenOfLayer(layer)), behind);
  return behind;
}
