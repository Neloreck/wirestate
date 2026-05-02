import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import _import from "eslint-plugin-import";
import jest from "eslint-plugin-jest";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  jsdoc.configs["flat/recommended"],
  {
    ignores: ["target/**/*", "node_modules/**/*", "examples/**/*"],
  },
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:jest/style",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/errors",
      "plugin:import/typescript",
      "plugin:react/recommended"
    )
  ),
  {
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      jest: fixupPluginRules(jest),
      import: fixupPluginRules(_import),
      react: fixupPluginRules(react),
      jsdoc,
      eslintConfigPrettier,
      reactHooks,
      reactRefresh,
      tseslint,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "writable",
      },
      parser: tsParser,
    },
    settings: {
      react: {
        pragma: "React",
        version: "17.0.0",
      },
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/explicit-member-accessibility": ["error"],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-require-imports": "off",
      "react/prop-types": "off",
      "import/no-unresolved": "off",
      "jsdoc/tag-lines": [
        "error",
        "any",
        {
          startLines: 1,
          endLines: 0,
        },
      ],
      "jsdoc/require-returns-check": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-property-type": "off",
      "jsdoc/require-throws-type": "off",
      "jsdoc/no-undefined-types": "off",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          next: "return",
          prev: "*",
        },
        {
          blankLine: "always",
          next: ["const", "let", "var"],
          prev: "expression",
        },
        {
          blankLine: "always",
          next: "*",
          prev: ["const", "let", "var"],
        },
        {
          blankLine: "always",
          next: "*",
          prev: ["for", "if", "while", "do", "with"],
        },
        {
          blankLine: "always",
          next: ["function", "class"],
          prev: ["function", "class"],
        },
        {
          blankLine: "any",
          next: ["const", "let", "var"],
          prev: ["const", "let", "var"],
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          custom: {
            match: true,
            regex: "^I[A-Z]",
          },
          format: ["PascalCase"],
          selector: "interface",
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
          groups: ["builtin", "external", "parent", "sibling", "index"],
          "newlines-between": "always",
          pathGroups: [
            {
              group: "external",
              pattern: "@/macroses/**",
              position: "after",
            },
            {
              group: "external",
              pattern: "@/**",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
    },
  },
];
