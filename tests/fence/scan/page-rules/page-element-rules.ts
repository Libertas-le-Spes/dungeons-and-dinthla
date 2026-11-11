import { isObjectLiteralExpression, isPropertyAccessExpression, isPropertyAssignment, isShorthandPropertyAssignment, isStringLiteral, type Expression, type ObjectLiteralElementLike } from "typescript/unstable/ast";
import type { FileScan } from "../reading/file-scan";
import { ATTRIBUTE_SETTERS, CSS_PROPERTY_SETTERS, ELEMENT_MAKERS, LINK_OPTION, OPTION_ATTRIBUTES, OPTION_TAKERS, PAGE_LINK, PICTURE_CSS, PICTURE_CSS_SOURCE, PICTURE_VALUE, NODE_MARK, STYLE_OWNERS, UNTYPED } from "../reading/names";
import type { NameUse } from "../reading/page-found";
import { nameTextOf } from "../reading/syntax";
import { flattened, isNamedOneOf } from "../reading/type-shapes";

function literalArgument(use: NameUse, index: number): string | null {
  if (use.call === null) return null;
  const argument = use.call.arguments[index];
  if (argument === undefined || !isStringLiteral(argument)) return null;
  return argument.text;
}

function attributeBreaches(scan: FileScan): string[] {
  const setters = scan.page.uses.filter((use) => ATTRIBUTE_SETTERS.includes(use.name));
  return setters.flatMap((use) => {
    const name = literalArgument(use, 0);
    if (name !== null && scan.allowances.attributes(scan.path, name)) return [];
    return [`${scan.where(use.node)} sets an attribute with ${use.name} other than one the plugin is allowed, named in place`];
  });
}

function tagBreaches(scan: FileScan): string[] {
  const makers = scan.page.uses.filter((use) => ELEMENT_MAKERS.includes(use.name));
  return makers.flatMap((use) => {
    const tag = literalArgument(use, 0);
    if (tag !== null && scan.allowances.tags(scan.path, tag)) return [];
    return [`${scan.where(use.node)} makes an element with ${use.name} other than one the plugin is allowed, named in place`];
  });
}

function keyOf(property: ObjectLiteralElementLike): string | null {
  if (!isPropertyAssignment(property) && !isShorthandPropertyAssignment(property)) return null;
  return nameTextOf(property.name);
}

function isPageLink(value: Expression): boolean {
  return isStringLiteral(value) && value.text.startsWith(PAGE_LINK);
}

function attributesAllowed(scan: FileScan, value: Expression): boolean {
  if (!isObjectLiteralExpression(value)) return false;
  return value.properties.every((property) => {
    const key = keyOf(property);
    return key !== null && scan.allowances.attributes(scan.path, key);
  });
}

interface CheckedOption {
  key: string;
  allowed(scan: FileScan, value: Expression): boolean;
}

const CHECKED_OPTIONS: CheckedOption[] = [
  { key: OPTION_ATTRIBUTES, allowed: attributesAllowed },
  { key: LINK_OPTION, allowed: (_scan, value) => isPageLink(value) },
];

function optionAllowed(scan: FileScan, property: ObjectLiteralElementLike): boolean {
  const key = keyOf(property);
  if (key === null || !scan.allowances.elementOptions(scan.path, key)) return false;
  const checked = CHECKED_OPTIONS.find((option) => option.key === key);
  if (checked === undefined) return true;
  return isPropertyAssignment(property) && checked.allowed(scan, property.initializer);
}

function optionsAllowed(scan: FileScan, options: Expression | undefined): boolean {
  if (options === undefined) return true;
  if (!isObjectLiteralExpression(options)) return false;
  return options.properties.every((property) => optionAllowed(scan, property));
}

function optionBreaches(scan: FileScan): string[] {
  return OPTION_TAKERS.flatMap((taker) => {
    const uses = scan.page.uses.filter((use) => use.name === taker.name);
    return uses.flatMap((use) => {
      if (use.call !== null && optionsAllowed(scan, use.call.arguments[taker.options])) return [];
      return [`${scan.where(use.node)} gives ${use.name} options other than the ones the plugin is allowed, written in place`];
    });
  });
}

function isPictureValue(scan: FileScan, value: Expression): boolean {
  if (!isPropertyAccessExpression(value) || value.name.text !== PICTURE_VALUE) return false;
  const owner = scan.project.checker.getTypeAtLocation(value.expression);
  if (owner === undefined) return false;
  return flattened(owner).every((member) => {
    const symbol = member.getSymbol();
    return isNamedOneOf(member, [PICTURE_CSS]) && symbol !== undefined && symbol.declarations.every((declaration) => declaration.path.endsWith(PICTURE_CSS_SOURCE));
  });
}

function cssValuesAllowed(scan: FileScan, use: NameUse): boolean {
  if (use.call === null) return false;
  const [properties] = use.call.arguments;
  if (properties === undefined || !isObjectLiteralExpression(properties)) return false;
  return properties.properties.every((property) => isPropertyAssignment(property) && isPictureValue(scan, property.initializer));
}

function cssBreaches(scan: FileScan): string[] {
  const setters = scan.page.uses.filter((use) => CSS_PROPERTY_SETTERS.includes(use.name));
  return setters.filter((use) => !cssValuesAllowed(scan, use)).map((use) => `${scan.where(use.node)} sets CSS with ${use.name} other than to a PictureCss value`);
}

function isPageNode(scan: FileScan, owner: Expression): boolean {
  const type = scan.project.checker.getTypeAtLocation(owner);
  if (type === undefined) return true;
  return flattened(type).some((member) => (member.flags & UNTYPED) !== 0 || scan.project.checker.getPropertyOfType(member, NODE_MARK) !== undefined);
}

function writeBreaches(scan: FileScan): string[] {
  const { project, found, types, where } = scan;
  const writes = scan.page.loadingWrites.filter((write) => isPageNode(scan, write.owner));
  const loading = writes.map((write) => `${where(write.node)} writes ${write.name}, which loads from or sends to an address`);
  const styled = types.typedBy(project, found.changedOwners, (type) => type === undefined || flattened(type).some((member) => isNamedOneOf(member, STYLE_OWNERS)));
  return [...loading, ...styled.map((node) => `${where(node)} writes an element's style`)];
}

export function pageElementBreaches(scan: FileScan): string[] {
  return [...attributeBreaches(scan), ...tagBreaches(scan), ...optionBreaches(scan), ...cssBreaches(scan), ...writeBreaches(scan)];
}
