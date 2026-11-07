import esbuild from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";

const demoPluginFolder = "demo-vault/.obsidian/plugins/dungeons-and-dinthla";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/state", "@codemirror/view"],
  format: "cjs",
  target: "es2022",
  outfile: "main.js",
  logLevel: "info",
});

await mkdir(demoPluginFolder, { recursive: true });
await copyFile("manifest.json", `${demoPluginFolder}/manifest.json`);
await copyFile("main.js", `${demoPluginFolder}/main.js`);
