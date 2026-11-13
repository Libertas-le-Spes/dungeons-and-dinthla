import type { Cap } from "./cap";
import type { NumberRange } from "./number-range";

export const REPLY_SIZE: Cap = { what: "The reply", most: 5_000_000, unit: "bytes" };

export const REPLY_DEPTH: Cap = { what: "The reply's nesting", most: 32, unit: "levels" };

export const NAME_LENGTH: Cap = { what: "A name", most: 100, unit: "characters" };
export const LINE_LENGTH: Cap = { what: "A line of text", most: 300, unit: "characters" };

export const CLASS_COUNT: Cap = { what: "The list of classes", most: 20, unit: "classes" };
export const ABILITY_COUNT: Cap = { what: "The list of ability overrides", most: 6, unit: "overrides" };
export const NUMBER_COUNT: Cap = { what: "The list of numbers", most: 100, unit: "numbers" };
export const INVENTORY_COUNT: Cap = { what: "The inventory", most: 500, unit: "items" };
export const SPELL_COUNT: Cap = { what: "The list of spells", most: 500, unit: "spells" };
export const FEATURE_COUNT: Cap = { what: "The list of features", most: 500, unit: "features" };

export const SCORE: NumberRange = { what: "An ability score", lowest: 1, highest: 30 };
export const ARMOUR_CLASS: NumberRange = { what: "Armor class", lowest: 0, highest: 40 };
export const HIT_POINTS: NumberRange = { what: "Hit points", lowest: 0, highest: 9_999 };
export const MAX_HIT_POINTS: NumberRange = { what: "Maximum hit points", lowest: 1, highest: 9_999 };
export const CLASS_LEVEL: NumberRange = { what: "A class level", lowest: 1, highest: 20 };
export const TOTAL_LEVEL: NumberRange = { what: "The total level", lowest: 1, highest: 40 };
export const SPEED: NumberRange = { what: "Speed", lowest: 0, highest: 500 };
export const COIN_COUNT: NumberRange = { what: "A coin count", lowest: 0, highest: 1_000_000 };
export const ITEM_COUNT: NumberRange = { what: "An item count", lowest: 0, highest: 9_999 };
