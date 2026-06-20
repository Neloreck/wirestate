import { transformSync } from "@swc/core";
import { swc } from "rollup-plugin-swc3";

export function swcBuildPlugin() {
  return swc({
    tsconfig: false,
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
        decorators: true,
      },
      transform: {
        decoratorVersion: "2023-11",
        useDefineForClassFields: true,
      },
      target: "es2022",
      keepClassNames: true,
      externalHelpers: true,
    },
  });
}

// Reproduces the former tsconfig `removeComments: true`. rollup-plugin-swc3 discards `jsc.minify` in its
// transform pass and only minifies (compacting the output) in its own renderChunk, so comments are
// stripped here with a non-minifying SWC pass that preserves the readable, multi-line formatting.
export function swcStripCommentsPlugin() {
  return {
    name: "swc-strip-comments",
    renderChunk(code: string, chunk: { fileName: string }) {
      const result = transformSync(code, {
        filename: chunk.fileName,
        jsc: {
          parser: { syntax: "ecmascript" },
          target: "es2022",
          minify: { compress: false, mangle: false, format: { comments: false } },
        },
      });

      return { code: result.code, map: result.map ?? null };
    },
  };
}
