import { withoutBullet } from "../parts/bullet";
import { partsBetweenCommas } from "../parts/comma";
import { findLinks } from "../parts/link";

export interface CharacterFact {
  name: string;
  value: string;
}

export interface LinkedFacts {
  target: string;
  facts: CharacterFact[];
}

const FACT_START = /^\s*([A-Za-z][A-Za-z ]*?)\s*:(.*)$/;
const LEADING_LINK = /^(\[\[[^[\]]+\]\])(.*)$/;

export function factsOf(text: string): CharacterFact[] {
  const facts: CharacterFact[] = [];
  for (const part of partsBetweenCommas(text)) {
    const start = FACT_START.exec(part);
    const last = facts[facts.length - 1];
    if (start !== null) facts.push({ name: start[1]!, value: start[2]! });
    else if (last !== undefined) last.value = `${last.value},${part}`;
    else return [];
  }
  return facts.map(({ name, value }) => ({ name, value: value.trim() })).filter(({ value }) => value !== "");
}

export function linkedFactsOf(line: string): LinkedFacts | null {
  const linked = LEADING_LINK.exec(withoutBullet(line));
  if (linked === null) return null;
  return { target: findLinks(linked[1]!)[0]!, facts: factsOf(linked[2]!) };
}
