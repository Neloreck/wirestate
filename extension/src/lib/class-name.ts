import type { Maybe } from "@/types/general";

/**
 * @param values - Class name fragments; `false`, `null`, `undefined`, and `""` are skipped.
 * @returns The truthy fragments joined by a single space.
 */
export function cn(...values: Array<Maybe<string | false>>): string {
  return values.filter(Boolean).join(" ");
}
