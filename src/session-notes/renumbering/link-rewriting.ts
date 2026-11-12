import { firstLineAfterProperties } from "../../campaign/paths/session-file";
import { hiddenLines } from "../../notes/reading/hidden-lines";
import { paired } from "./paired";
import { lineWithTargetsMasked, lineWithTargetsReplaced, targetsOf, type NewTarget } from "./wiki-links";

interface LineRules {
  firstLine: number;
  hidden: Set<number>;
}

function rulesOf(text: string): LineRules {
  return { firstLine: firstLineAfterProperties(text), hidden: hiddenLines(text) };
}

function isRewritable(index: number, rules: LineRules): boolean {
  return index >= rules.firstLine && !rules.hidden.has(index);
}

function targetKeptOrRenamed(was: string, now: string, newTarget: NewTarget): boolean {
  if (now === was) return true;
  return now === newTarget(was);
}

function targetsKeptOrRenamed(before: string, after: string, newTarget: NewTarget): boolean {
  const targets = paired(targetsOf(before), targetsOf(after));
  if (targets === null) return false;
  return targets.every(([was, now]) => targetKeptOrRenamed(was, now, newTarget));
}

function lineChangedOnlyInTargets(before: string, after: string, newTarget: NewTarget): boolean {
  if (lineWithTargetsMasked(before) !== lineWithTargetsMasked(after)) return false;
  return targetsKeptOrRenamed(before, after, newTarget);
}

export function withLinksRewritten(text: string, newTarget: NewTarget): string {
  const rules = rulesOf(text);
  const rewritten: string[] = [];
  for (const [index, line] of text.split("\n").entries()) {
    if (isRewritable(index, rules)) rewritten.push(lineWithTargetsReplaced(line, newTarget));
    else rewritten.push(line);
  }
  return rewritten.join("\n");
}

function lineKeptOrRetargeted(index: number, was: string, now: string, rules: LineRules, newTarget: NewTarget): boolean {
  if (isRewritable(index, rules)) return lineChangedOnlyInTargets(was, now, newTarget);
  return was === now;
}

export function linkOnSkippedLine(text: string, newTarget: NewTarget): boolean {
  const rules = rulesOf(text);
  for (const [index, line] of text.split("\n").entries()) {
    if (isRewritable(index, rules)) continue;
    if (lineWithTargetsReplaced(line, newTarget) !== line) return true;
  }
  return false;
}

export function onlyLinkTargetsChanged(before: string, after: string, newTarget: NewTarget): boolean {
  const rules = rulesOf(before);
  const lines = paired(before.split("\n"), after.split("\n"));
  if (lines === null) return false;
  for (const [index, [was, now]] of lines.entries()) {
    if (!lineKeptOrRetargeted(index, was, now, rules, newTarget)) return false;
  }
  return true;
}
