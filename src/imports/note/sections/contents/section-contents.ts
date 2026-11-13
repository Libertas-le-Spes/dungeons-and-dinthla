import { FeaturesContent } from "./features-content";
import { InventoryContent } from "./inventory-content";
import { NumbersContent } from "./numbers-content";
import { PurseContent } from "./purse-content";
import type { SectionContent } from "./section-content";
import { SpellsContent } from "./spells-content";

export const SECTION_CONTENTS: readonly SectionContent[] = [
  new NumbersContent(),
  new InventoryContent(),
  new PurseContent(),
  new SpellsContent(),
  new FeaturesContent(),
];
