import { firstLineAfterProperties } from "../../campaign/paths/session-file";
import { hiddenLines } from "../../notes/reading/hidden-lines";
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

function targetKeptOrRenamed(was: string, now: string | undefined, newTarget: NewTarget): boolean {
  if (now === was) return true;
  return now === newTarget(was);
}

function targetsKeptOrRenamed(before: string, after: string, newTarget: NewTarget): boolean {
  const wasTargets = targetsOf(before);
  const nowTargets = targetsOf(after);
  for (const [index, was] of wasTargets.entries()) {
    if (!targetKeptOrRenamed(was, nowTargets[index], newTarget)) return false;
  }
  return true;
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

export function onlyLinkTargetsChanged(before: string, after: string, newTarget: NewTarget): boolean {
  const rules = rulesOf(before);
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  if (beforeLines.length !== afterLines.length) return false;
  for (const [index, now] of afterLines.entries()) {
    const was = beforeLines[index];
    if (was === undefined) return false;
    if (!lineKeptOrRetargeted(index, was, now, rules, newTarget)) return false;
  }
  return true;
}
