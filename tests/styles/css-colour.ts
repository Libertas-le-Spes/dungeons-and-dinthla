export interface Colour {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

type Space = "srgb" | "oklab" | "oklch";

const NAMED: Record<string, Colour> = {
  white: { r: 1, g: 1, b: 1, alpha: 1 },
  black: { r: 0, g: 0, b: 0, alpha: 1 },
  transparent: { r: 0, g: 0, b: 0, alpha: 0 },
};

function toLinear(channel: number): number {
  if (channel <= 0.04045) return channel / 12.92;
  return ((channel + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
  let gamma = 1.055 * channel ** (1 / 2.4) - 0.055;
  if (channel <= 0.0031308) gamma = channel * 12.92;
  return Math.min(1, Math.max(0, gamma));
}

function toOklab({ r, g, b }: Colour): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([lightness, a, b]: [number, number, number], alpha: number): Colour {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha,
  };
}

function mixOklch(first: Colour, second: Colour, share: number): Colour {
  const [l1, a1, b1] = toOklab(first);
  const [l2, a2, b2] = toOklab(second);
  const [c1, c2] = [Math.hypot(a1, b1), Math.hypot(a2, b2)];
  let h1 = Math.atan2(b1, a1);
  let h2 = Math.atan2(b2, a2);
  if (c1 < 1e-4) h1 = h2;
  if (c2 < 1e-4) h2 = h1;
  let turn = h2 - h1;
  if (turn > Math.PI) turn -= 2 * Math.PI;
  if (turn < -Math.PI) turn += 2 * Math.PI;
  const lightness = l1 * share + l2 * (1 - share);
  const chroma = c1 * share + c2 * (1 - share);
  const hue = h1 + turn * (1 - share);
  return fromOklab([lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)], 1);
}

function mix(space: Space, first: Colour, second: Colour, share: number): Colour {
  if (second.alpha === 0) return { ...first, alpha: first.alpha * share };
  if (first.alpha === 0) return { ...second, alpha: second.alpha * (1 - share) };
  if (space === "oklch") return mixOklch(first, second, share);
  if (space === "oklab") {
    const [x, y] = [toOklab(first), toOklab(second)];
    return fromOklab([0, 1, 2].map((i) => x[i]! * share + y[i]! * (1 - share)) as [number, number, number], 1);
  }
  return {
    r: first.r * share + second.r * (1 - share),
    g: first.g * share + second.g * (1 - share),
    b: first.b * share + second.b * (1 - share),
    alpha: 1,
  };
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === "," && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

function readShare(part: string): { colour: string; share: number | null } {
  const match = /^(.*\S)\s+(\d+(?:\.\d+)?)%$/.exec(part);
  if (match === null) return { colour: part, share: null };
  return { colour: match[1]!, share: Number(match[2]) / 100 };
}

function readHex(hex: string): Colour {
  let digits = hex;
  if (hex.length <= 4) digits = [...hex].map((digit) => digit + digit).join("");
  const channel = (index: number) => Number.parseInt(digits.slice(index * 2, index * 2 + 2), 16) / 255;
  let alpha = 1;
  if (digits.length === 8) alpha = channel(3);
  return { r: channel(0), g: channel(1), b: channel(2), alpha };
}

export function parseColour(value: string): Colour {
  const text = value.trim();
  const named = NAMED[text];
  if (named !== undefined) return named;
  if (text.startsWith("#")) return readHex(text.slice(1));
  const rgb = /^rgba?\((.*)\)$/.exec(text);
  if (rgb !== null) {
    const [r, g, b, alpha = "1"] = rgb[1]!.split(",").map((part) => part.trim());
    return { r: Number(r) / 255, g: Number(g) / 255, b: Number(b) / 255, alpha: Number(alpha) };
  }
  const colourMix = /^color-mix\((.*)\)$/.exec(text);
  if (colourMix !== null) {
    const [spacePart, firstPart, secondPart] = splitTopLevel(colourMix[1]!);
    const space = spacePart!.replace(/^in\s+/, "") as Space;
    const first = readShare(firstPart!);
    const second = readShare(secondPart!);
    let share = first.share;
    if (share === null && second.share !== null) share = 1 - second.share;
    if (share === null) share = 0.5;
    return mix(space, parseColour(first.colour), parseColour(second.colour), share);
  }
  throw new Error(`Can't read the colour ${text}`);
}

export function over(top: Colour, bottom: Colour): Colour {
  const a = top.alpha;
  return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), alpha: 1 };
}

function luminance({ r, g, b }: Colour): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrast(first: Colour, second: Colour): number {
  const [x, y] = [luminance(first), luminance(second)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
