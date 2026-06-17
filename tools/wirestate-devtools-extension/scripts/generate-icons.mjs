// Rasterizes icons/icon.svg into the PNG sizes Chrome needs (it rejects SVG for manifest/panel
// icons). Uses a WASM rasterizer so there's no native build step. Re-run with `pnpm icons`.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { initWasm, Resvg } from "@resvg/resvg-wasm";

const require = createRequire(import.meta.url);
const wasmPath = join(dirname(require.resolve("@resvg/resvg-wasm")), "index_bg.wasm");

await initWasm(readFileSync(wasmPath));

const iconsDir = fileURLToPath(new URL("../icons/", import.meta.url));
const svg = readFileSync(join(iconsDir, "icon.svg"), "utf8");

for (const size of [16, 32, 48, 128]) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  const file = join(iconsDir, `icon-${size}.png`);

  writeFileSync(file, png);

  console.log(`icons/icon-${size}.png (${png.length} bytes)`);
}
