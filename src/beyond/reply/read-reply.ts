import { characterNumberOf } from "./character-number";
import { JsonReader } from "./json/json-reader";
import { ONLINE } from "./common/online-route";
import { classesOf } from "./parts/read-classes";
import { featuresOf } from "./parts/read-features";
import { nameOf, speciesOf } from "./parts/read-identity";
import { inventoryOf } from "./parts/read-inventory";
import { purseOf } from "./parts/read-purse";
import { spellsOf } from "./parts/read-spells";
import { safeJsonOf } from "./parsing/safe-json";
import type { RepliedCharacter } from "./replied-character";
import { replyDataOf } from "./reply-data";
import { numbersWithoutScores, scoresIn } from "./worked/split-scores";
import { workedNumbersOf } from "./worked/worked-numbers";

export function readReply(text: string): RepliedCharacter {
  const data = replyDataOf(JsonReader.of(safeJsonOf(text)));
  const worked = workedNumbersOf(data);
  return {
    id: characterNumberOf(data),
    character: {
      route: ONLINE,
      name: nameOf(data),
      species: speciesOf(data),
      classes: classesOf(data),
      scores: scoresIn(worked),
      numbers: numbersWithoutScores(worked),
      inventory: inventoryOf(data),
      purse: purseOf(data),
      spells: spellsOf(data),
      features: featuresOf(data),
    },
  };
}
