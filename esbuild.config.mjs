import esbuild from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { PLUGIN_BUNDLE } from "./scripts/bundle-options.ts";

const demoPluginFolder = "demo-vault/.obsidian/plugins/dungeons-and-dinthla";

await esbuild.build(PLUGIN_BUNDLE);

await esbuild.build({
  entryPoints: ["styles/index.css"],
  bundle: true,
  loader: { ".woff2": "dataurl" },
  outfile: "styles.css",
  logLevel: "info",
});

await mkdir(demoPluginFolder, { recursive: true });
await copyFile("manifest.json", `${demoPluginFolder}/manifest.json`);
await copyFile("main.js", `${demoPluginFolder}/main.js`);
await copyFile("styles.css", `${demoPluginFolder}/styles.css`);
