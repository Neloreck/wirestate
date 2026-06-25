import { type InspectNode } from "@/bridge/bridge.messages";

/**
 * The IDE-like color buckets a rendered value falls into.
 * `neutral` inherits the surrounding color.
 */
export type ValueColor = "string" | "number" | "boolean" | "nullish" | "function" | "neutral";

const INSPECT_NODE_COLOR_CLASS: Record<ValueColor, string> = {
  string: "text-val-string",
  number: "text-val-number",
  boolean: "text-val-boolean",
  nullish: "text-val-nullish italic",
  function: "text-val-function",
  neutral: "",
};

/**
 * @param node - The inspected node to classify.
 * @returns The color bucket for the node's value.
 */
export function inspectNodeToValueColor(node: InspectNode): ValueColor {
  switch (node.kind) {
    case "primitive":
      if (node.value === null) {
        return "nullish";
      }

      switch (typeof node.value) {
        case "string":
          return "string";
        case "number":
          return "number";
        case "boolean":
          return "boolean";
        default:
          return "neutral";
      }

    case "leaf":
      if (node.preview === "undefined") {
        return "nullish";
      }

      return node.preview.startsWith("ƒ") ? "function" : "neutral";
    default:
      return "neutral";
  }
}

/**
 * The Tailwind class(es) that color a value node, or an empty string when it should inherit color.
 *
 * @param node - The inspected node to color.
 * @returns A class string for the node's value type.
 */
export function getInspectNodeColorClass(node: InspectNode): string {
  return INSPECT_NODE_COLOR_CLASS[inspectNodeToValueColor(node)];
}
