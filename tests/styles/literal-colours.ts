import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const COLOUR_NAMES = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
  "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
  "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
  "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue",
  "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush",
  "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow", "lime",
  "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
  "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray",
  "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white",
  "whitesmoke", "yellow", "yellowgreen",
];

const HEX = /#[0-9a-fA-F]{3,8}(?![\w-])/g;
const COLOUR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;
const NAMED_IN_CSS = new RegExp(`:[^;{}]*?(?<![\\w-])(?:${COLOUR_NAMES.join("|")})(?![\\w-])[^;{}]*`, "g");
const NAMED_IN_CODE = new RegExp(`["'\`](?:${COLOUR_NAMES.join("|")})["'\`]`, "g");

function matchesOf({ text, pattern }: { text: string; pattern: RegExp }): string[] {
  return [...text.matchAll(pattern)].map(([found]) => found.trim());
}

export function literalColoursInStyles(css: string): string[] {
  return [
    ...matchesOf({ text: css, pattern: HEX }),
    ...matchesOf({ text: css, pattern: COLOUR_FUNCTION }),
    ...matchesOf({ text: css, pattern: NAMED_IN_CSS }),
  ];
}

export function literalColoursInCode(code: string): string[] {
  return [
    ...matchesOf({ text: code, pattern: HEX }),
    ...matchesOf({ text: code, pattern: COLOUR_FUNCTION }),
    ...matchesOf({ text: code, pattern: NAMED_IN_CODE }),
  ];
}

function filesUnder({ folder, extension }: { folder: string; extension: string }): string[] {
  return readdirSync(folder, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => join(entry.parentPath, entry.name));
}

export function styleFiles(): string[] {
  return filesUnder({ folder: join(import.meta.dirname, "../../styles"), extension: ".css" });
}

export function sourceFiles(): string[] {
  return filesUnder({ folder: join(import.meta.dirname, "../../src"), extension: ".ts" });
}

export function textOf(file: string): string {
  return readFileSync(file, "utf8");
}
