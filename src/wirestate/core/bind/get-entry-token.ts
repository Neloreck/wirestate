import type { ServiceIdentifier } from "inversify";

import type { IInjectableDescriptor } from "@/wirestate/types/privision";
import type { TServiceClass } from "@/wirestate/types/services";

/**
 * Returns the container token for a service entry.
 * For plain service classes the class itself is the token;
 * for descriptors the `id` field is used.
 *
 * @param entry - entry descriptor to get service identifier for
 * @returns injectable identifier token
 */
export function getEntryToken(entry: TServiceClass | IInjectableDescriptor): ServiceIdentifier {
  return typeof entry === "function" ? entry : entry.id;
}
