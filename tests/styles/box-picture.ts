import { over, type Colour } from "./css-colour";
import { panelOver } from "./panel-background";
import { declarationOf, readStyles } from "./style-files";

const FILE = "campaign-background.css";
const FRAME = ".dd-tab-picture .dd-box-frame";
const PICTURE_LAYER = ".dd-tab-picture .dd-box-frame::before";
const TOKEN = /^var\(--([\w-]+)\)$/;
const FILTER_STEP = /([\w-]+)\(([\d.]+)\)/g;

type FilterStep = (channel: number, amount: number) => number;

function contrastStep(channel: number, amount: number): number {
  return (channel - 0.5) * amount + 0.5;
}

function brightnessStep(channel: number, amount: number): number {
  return channel * amount;
}

const FILTERS: Record<string, FilterStep> = { contrast: contrastStep, brightness: brightnessStep };

function declared(selector: string, property: string): string {
  const value = declarationOf(FILE, selector, property);
  if (value === null) throw new Error(`${selector} sets no ${property} in ${FILE}`);
  return value;
}

function numberToken(name: string): number {
  const found = new RegExp(`--${name}:\\s*([\\d.]+);`).exec(readStyles("tokens.css"));
  if (found === null) throw new Error(`tokens.css sets no --${name}`);
  return Number(found[1]);
}

function idleOpacity(): number {
  const token = TOKEN.exec(declared(PICTURE_LAYER, "opacity"));
  if (token === null) throw new Error("The note box picture's opacity is not a token");
  return numberToken(token[1]!);
}

function clamped(channel: number): number {
  return Math.min(1, Math.max(0, channel));
}

function stepped(colour: Colour, step: FilterStep, amount: number): Colour {
  return {
    r: clamped(step(colour.r, amount)),
    g: clamped(step(colour.g, amount)),
    b: clamped(step(colour.b, amount)),
    alpha: colour.alpha,
  };
}

function readsWhole(filter: string): boolean {
  const steps: string[] = [];
  for (const [whole] of filter.matchAll(FILTER_STEP)) steps.push(whole);
  return steps.join(" ") === filter.trim();
}

function filtered(picture: Colour, filter: string): Colour {
  if (!readsWhole(filter)) throw new Error(`The contrast test can't read the filter ${filter}`);
  let shown = picture;
  for (const [, name, amount] of filter.matchAll(FILTER_STEP)) {
    const step = FILTERS[name!];
    if (step === undefined) throw new Error(`The contrast test can't apply the filter ${name}`);
    shown = stepped(shown, step, Number(amount));
  }
  return shown;
}

export function noteBoxOver(token: (name: string) => Colour, picture: Colour): Colour {
  const page = panelOver(token, "campaign.css", ".dd-campaign .dd-page-body", picture);
  const panel = panelOver(token, "session-notes.css", ".dd-session-notes .dd-notes-panel", page);
  const frame = panelOver(token, FILE, FRAME, panel);
  const shown = filtered(picture, declared(PICTURE_LAYER, "filter"));
  return over({ ...shown, alpha: idleOpacity() }, frame);
}
