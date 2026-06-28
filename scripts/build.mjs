import { build } from "esbuild";
import fs from "node:fs";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url))
);

const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} */`;

const common = {
  entryPoints: ["src/index.js"],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2018"],
  banner: { js: banner },
};

await build({
  ...common,
  outfile: "dist/index.js",
  sourcemap: true,
  minify: false,
});

await build({
  ...common,
  outfile: "dist/index.min.js",
  sourcemap: true,
  minify: true,
});
