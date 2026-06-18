import jsPlugin from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";
import jsdocPlugin from "eslint-plugin-jsdoc";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import globals from "globals";
import tsPlugin from "typescript-eslint";

export default [
  {
    ignores: [
      "docs/.vitepress/dist/**/*",
      "docs/.vitepress/cache/**/*",
      "examples/**/*",
      "node_modules/**/*",
      "target/**/*",
      "**/dist/**/*",
    ],
  },
  jsdocPlugin.configs["flat/recommended"],
  jsPlugin.configs.recommended,
  jestPlugin.configs["flat/style"],
  ...tsPlugin.configs.recommended,
  importPlugin.flatConfigs.errors,
  importPlugin.flatConfigs.typescript,
  reactPlugin.configs.flat.recommended,
  {
    plugins: {
      eslintConfigPrettier,
      reactHooks: reactHooksPlugin,
      reactRefresh: reactRefreshPlugin,
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
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "react/prop-types": "off",
      "react/jsx-curly-brace-presence": ["error", { props: "always", children: "ignore" }],
      "import/no-unresolved": "off",
      "jsdoc/tag-lines": [
        "error",
        "any",
        {
          startLines: 1,
          endLines: 0,
        },
      ],
      "jsdoc/require-description-complete-sentence": [
        "error",
        {
          tags: ["param", "returns"],
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
              pattern: "@/fixtures/**",
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
  {
    files: ["src/wirestate-core/**/*.ts"],
    rules: {
      "import/no-cycle": ["error", { ignoreExternal: true }],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/wirestate-*/**", "**/wirestate/**"],
              message: "Cross-package imports must use the package public entry, e.g. `@wirestate/core`.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSUnionType > TSNullKeyword",
          message: "Use the Nullable<T> (or Maybe<T>) alias instead of an inline `| null` union.",
        },
        {
          selector: "TSUnionType > TSUndefinedKeyword",
          message: "Use the Optional<T> (or Maybe<T>) alias instead of an inline `| undefined` union.",
        },
      ],
    },
  },
  {
    // The alias definitions are the one place inline `| null` / `| undefined` is intended.
    files: ["**/types/general.ts", "src/fixtures/types.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
];
