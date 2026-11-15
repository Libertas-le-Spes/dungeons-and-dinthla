import type { ReferenceKindName } from "../../kinds/reference-kind";
import type { UndecidedName } from "../making/reference-note-plan";
import type { NewNames } from "./new-names";

export interface NameChosen {
  undecided: UndecidedName;
  kind: ReferenceKindName;
}

export interface NewNamesChoice {
  chosen(choice: NameChosen): void;
  closed(): void;
}

export type AskNewNames = (names: NewNames, to: NewNamesChoice) => void;
