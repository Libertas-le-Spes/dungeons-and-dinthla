import { isBindingElement } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { CHARACTER_DATA, CHARACTER_DATA_OWNERS, ELEMENT_LISTENER_OWNERS, ELEMENT_QUERIES, OBSIDIAN_ELEMENT_LISTENERS, OBSIDIAN_ELEMENT_QUERIES, PAGE_TEXT, POST_PROCESSORS } from "../reading/names";
import type { NameUse } from "../reading/page-found";
import { isInObsidianFolder } from "../reading/library-paths";
import { isLibraryFile, isOwnedByOneOf } from "../reading/type-shapes";

function symbolsOf(scan: FileScan, uses: NameUse[]) {
  if (uses.length === 0) return [];
  return scan.project.checker.getSymbolAtLocation(uses.map((use) => use.node));
}

function characterData(scan: FileScan): NameUse[] {
  const uses = scan.page.uses.filter((use) => use.name === CHARACTER_DATA && use.member);
  const symbols = symbolsOf(scan, uses);
  return uses.filter((_use, index) => isOwnedByOneOf(symbols[index], CHARACTER_DATA_OWNERS));
}

function obsidianQueries(scan: FileScan): NameUse[] {
  const uses = scan.page.uses.filter((use) => OBSIDIAN_ELEMENT_QUERIES.includes(use.name));
  const symbols = symbolsOf(scan, uses);
  return uses.filter((_use, index) => {
    const symbol = symbols[index];
    if (symbol === undefined) return true;
    return symbol.declarations.some((declaration) => isInObsidianFolder(declaration.path));
  });
}

function elementListeners(scan: FileScan): NameUse[] {
  const uses = scan.page.uses.filter((use) => OBSIDIAN_ELEMENT_LISTENERS.includes(use.name) && use.member);
  const symbols = symbolsOf(scan, uses);
  return uses.filter((_use, index) => {
    const symbol = symbols[index];
    if (symbol === undefined) return true;
    const owner = symbol.getParent();
    if (owner === undefined || !ELEMENT_LISTENER_OWNERS.includes(owner.name)) return false;
    return symbol.declarations.some((declaration) => isInObsidianFolder(declaration.path));
  });
}

function pageTextNames(scan: FileScan): NameUse[] {
  const uses = scan.page.uses.filter((use) => PAGE_TEXT.includes(use.name));
  const symbols = symbolsOf(scan, uses);
  return uses.filter((use, index) => {
    const symbol = symbols[index];
    if (symbol === undefined || isBindingElement(use.node.parent)) return true;
    return symbol.declarations.some((declaration) => isLibraryFile(declaration.path));
  });
}

function postProcessorBreaches(scan: FileScan): string[] {
  if (scan.allowances.postProcessing(scan.path)) return [];
  const uses = scan.page.uses.filter((use) => POST_PROCESSORS.includes(use.name));
  return uses.map((use) => `${scan.where(use.node)} registers a post-processor with ${use.name}, which hands over every rendered note`);
}

function textBreaches(scan: FileScan): string[] {
  if (scan.allowances.pageText(scan.path)) return [];
  const uses = [...pageTextNames(scan), ...characterData(scan)];
  return uses.map((use) => `${scan.where(use.node)} reads the page's text with ${use.name}`);
}

function queryBreaches(scan: FileScan): string[] {
  if (scan.allowances.elementQueries(scan.path)) return [];
  const uses = [...scan.page.uses.filter((use) => ELEMENT_QUERIES.includes(use.name)), ...obsidianQueries(scan), ...elementListeners(scan)];
  return uses.map((use) => `${scan.where(use.node)} looks elements up with ${use.name}`);
}

export function pageTextBreaches(scan: FileScan): string[] {
  return [...postProcessorBreaches(scan), ...textBreaches(scan), ...queryBreaches(scan)];
}
