import type { MakeResult } from "../../note-keeping/make-result";
import type { ReferenceKindName } from "../../kinds/reference-kind";
import type { UndecidedName } from "../making/reference-note-plan";
import type { NewNames } from "./new-names";

export interface NameChosen {
  undecided: UndecidedName;
  kind: ReferenceKindName;
}

export interface NewNamesChoice {
  chosen(choice: NameChosen): Promise<MakeResult>;
  closed(): void;
}

export type AskNewNames = (names: NewNames, to: NewNamesChoice) => void;
