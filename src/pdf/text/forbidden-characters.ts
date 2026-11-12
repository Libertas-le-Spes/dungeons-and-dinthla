const TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;
const LAST_CONTROL = 0x1f;
const FIRST_DELETE_OR_C1 = 0x7f;
const LAST_C1 = 0x9f;
const FIRST_NONCHARACTER = 0xfdd0;
const LAST_NONCHARACTER = 0xfdef;
const NOT_A_CHARACTER = 0xfffe;
const NOT_A_CHARACTER_TOO = 0xffff;

function isAllowedControl(unit: number): boolean {
  return unit === TAB || unit === LINE_FEED || unit === CARRIAGE_RETURN;
}

function isControl(unit: number): boolean {
  if (unit <= LAST_CONTROL) return !isAllowedControl(unit);
  return unit >= FIRST_DELETE_OR_C1 && unit <= LAST_C1;
}

function isNoncharacter(unit: number): boolean {
  if (unit >= FIRST_NONCHARACTER && unit <= LAST_NONCHARACTER) return true;
  return unit === NOT_A_CHARACTER || unit === NOT_A_CHARACTER_TOO;
}

export function isForbiddenUnit(unit: number): boolean {
  return isControl(unit) || isNoncharacter(unit);
}
