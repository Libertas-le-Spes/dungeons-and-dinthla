import esbuild from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { PLUGIN_BUNDLE, STYLES_BUNDLE } from "./scripts/bundle-options.ts";

const demoPluginFolder = "demo-vault/.obsidian/plugins/dungeons-and-dinthla";

await esbuild.build(PLUGIN_BUNDLE);

await esbuild.build(STYLES_BUNDLE);

await mkdir(demoPluginFolder, { recursive: true });
await copyFile("manifest.json", `${demoPluginFolder}/manifest.json`);
await copyFile("main.js", `${demoPluginFolder}/main.js`);
await copyFile("styles.css", `${demoPluginFolder}/styles.css`);
