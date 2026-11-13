import { Refusal } from "../../../../beyond/shape/refusal";
import type { Route } from "../../../../beyond/shape/route";
import { IMPORTED_FROM_PROPERTY, IMPORTED_ON_PROPERTY } from "../../../layout/import-properties";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROUTE_NAME = /^[a-z]{1,16}$/;

export function importMarkLinesOf(route: Route, today: string): string[] {
  if (!DATE.test(today)) throw new Refusal("The import's date is not a day written as year-month-day.");
  if (!ROUTE_NAME.test(route.name)) throw new Refusal("The import's route has no plain name.");
  return [`${IMPORTED_ON_PROPERTY}: ${today}`, `${IMPORTED_FROM_PROPERTY}: ${route.name}`];
}
