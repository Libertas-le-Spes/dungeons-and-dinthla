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
const SYSTEM_COLOURS = [
  "accentcolor", "accentcolortext", "activetext", "buttonborder", "buttonface", "buttontext", "canvas", "canvastext", "field", "fieldtext",
  "graytext", "highlight", "highlighttext", "linktext", "mark", "marktext", "selecteditem", "selecteditemtext", "visitedtext",
  "activeborder", "activecaption", "appworkspace", "buttonhighlight", "buttonshadow", "captiontext", "inactiveborder",
  "inactivecaption", "inactivecaptiontext", "infotext", "menutext", "threeddarkshadow",
  "threedface", "threedhighlight", "threedlightshadow", "threedshadow", "windowframe", "windowtext",
];

const CSS_WORDS = [...COLOUR_NAMES, ...SYSTEM_COLOURS].join("|");
const CODE_WORDS = COLOUR_NAMES.join("|");
const CSS_HEX = /(?<![\w&])#[0-9a-f]{3,8}(?![\w-])/gi;
const CODE_HEX = /(?<=["'`:(,]\s*)#[0-9a-f]{3,8}(?![\w-])/gi;
const COLOUR_FUNCTION = /(?<![\w-])(?:(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[\d.%+-]|color\(\s*[a-z-]+\s+[\d.%+-])/gi;
const RULE_BODY = /\{([^{}]*)\}/g;
const DECLARATION_VALUE = /:([^;]*)/g;
const NAMED_CSS = new RegExp(`(?<![\\w-])(?:${CSS_WORDS})(?![\\w-])`, "gi");
const STRING = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g;
const TEMPLATE_PART = /\$\{[^}]*\}/g;
const NAMED_CODE = new RegExp(`(?<![\\w-])(?:${CODE_WORDS})(?![\\w-])`, "gi");

function matchesOf({ text, pattern }: { text: string; pattern: RegExp }): string[] {
  return [...text.matchAll(pattern)].map(([found]) => found.trim());
}

function namedColoursInStrings(code: string): string[] {
  return matchesOf({ text: code, pattern: STRING }).flatMap((text) => matchesOf({ text: text.replace(TEMPLATE_PART, ""), pattern: NAMED_CODE }));
}

function namedColoursInDeclarations(css: string): string[] {
  const bodies = matchesOf({ text: css, pattern: RULE_BODY });
  const values = bodies.flatMap((body) => [...body.matchAll(DECLARATION_VALUE)].map(([, value]) => value as string));
  return values.flatMap((value) => matchesOf({ text: value, pattern: NAMED_CSS }));
}

export function literalColoursInStyles(css: string): string[] {
  return [
    ...matchesOf({ text: css, pattern: CSS_HEX }),
    ...matchesOf({ text: css, pattern: COLOUR_FUNCTION }),
    ...namedColoursInDeclarations(css),
  ];
}

export function literalColoursInCode(code: string): string[] {
  return [
    ...matchesOf({ text: code, pattern: CODE_HEX }),
    ...matchesOf({ text: code, pattern: COLOUR_FUNCTION }),
    ...namedColoursInStrings(code),
  ];
}
