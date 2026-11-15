import { CLASS_COUNT } from "../../../shape/import-limits";
import type { JsonReader } from "../../json/json-reader";
import { classFeaturesOf } from "../features/class-features";

export interface ClassOwners {
  readonly isMulticlass: boolean;
  readonly startedBy: ReadonlyMap<number, boolean>;
}

export function classOwnersOf(data: JsonReader): ClassOwners {
  const classes = data.listAt("classes", CLASS_COUNT);
  const startedBy = new Map<number, boolean>();
  for (const classEntry of classes) {
    const starting = classEntry.booleanAt("isStartingClass");
    for (const feature of classFeaturesOf(classEntry)) {
      const id = feature.readerAt("definition").numberAt("id");
      if (id !== null) startedBy.set(id, starting);
    }
  }
  return { isMulticlass: classes.length > 1, startedBy };
}
