import { PluginSection } from "./plugin-section";

export const NUMBERS_SECTION = new PluginSection("Numbers");
export const INVENTORY_SECTION = new PluginSection("Inventory");
export const PURSE_SECTION = new PluginSection("Purse");
export const SPELLS_SECTION = new PluginSection("Spells");
export const FEATURES_SECTION = new PluginSection("Features");

export const PLUGIN_SECTIONS: readonly PluginSection[] = [NUMBERS_SECTION, INVENTORY_SECTION, PURSE_SECTION, SPELLS_SECTION, FEATURES_SECTION];
