import { DraconicResilience } from "./draconic-resilience";
import { FeaturePerLevel } from "./feature-per-level";
import type { PerLevelSource } from "./per-level-source";

export const PER_LEVEL_SOURCES: readonly PerLevelSource[] = [new FeaturePerLevel("Tough", 2), new FeaturePerLevel("Dwarven Toughness", 1), new DraconicResilience()];
