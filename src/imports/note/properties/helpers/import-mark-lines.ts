import { Refusal } from "../../../../beyond/shape/refusal";
import type { Route } from "../../../../beyond/shape/route";
import { BEYOND_PROPERTY, IMPORTED_FROM_PROPERTY, IMPORTED_ON_PROPERTY, IMPORTED_SESSION_PROPERTY } from "../../../layout/import-properties";
import type { ImportStamp } from "../import-stamp";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROUTE_NAME = /^[a-z]{1,16}$/;
const MOST_BEYOND_NUMBER = 999_999_999_999;

export interface ImportMarks {
  route: Route;
  stamp: ImportStamp;
  beyondNumber: number | null;
}

function beyondLinesOf(beyondNumber: number | null): string[] {
  if (beyondNumber === null) return [];
  if (!Number.isSafeInteger(beyondNumber) || beyondNumber < 1 || beyondNumber > MOST_BEYOND_NUMBER) throw new Refusal("The character's D&D Beyond number is not a whole number D&D Beyond could give.");
  return [`${BEYOND_PROPERTY}: ${beyondNumber}`];
}

export function importMarkLinesOf({ route, stamp, beyondNumber }: ImportMarks): string[] {
  if (!DATE.test(stamp.today)) throw new Refusal("The import's date is not a day written as year-month-day.");
  if (!ROUTE_NAME.test(route.name)) throw new Refusal("The import's route has no plain name.");
  return [`${IMPORTED_ON_PROPERTY}: ${stamp.today}`, `${IMPORTED_FROM_PROPERTY}: ${route.name}`, `${IMPORTED_SESSION_PROPERTY}: ${stamp.session}`, ...beyondLinesOf(beyondNumber)];
}
