import jsPlugin from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tsPlugin from "typescript-eslint";

export default [
  {
    ignores: ["target/**/*", "node_modules/**/*", "examples/**/*"],
  },
  jsPlugin.configs.recommended,
  ...tsPlugin.configs.recommended,
  importPlugin.flatConfigs.errors,
  importPlugin.flatConfigs.typescript,
  {
    plugins: {
      eslintConfigPrettier,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
    },
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/ban-ts-ignore": "off",
      "@typescript-eslint/explicit-member-accessibility": ["error"],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/no-require-imports": "off",
      "import/no-unresolved": "off",
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
