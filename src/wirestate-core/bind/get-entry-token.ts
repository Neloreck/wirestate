import type { Newable, ServiceIdentifier } from "inversify";

import type { InjectableDescriptor } from "../types/privision";

/**
 * Returns the container token for a service entry.
 * For plain service classes the class itself is the token;
 * for descriptors the `id` field is used.
 *
 * @group bind
 *
 * @param entry - entry descriptor to get service identifier for
 * @returns injectable identifier token
 */
export function getEntryToken<T extends object = object>(entry: Newable<T> | InjectableDescriptor): ServiceIdentifier {
  return typeof entry === "function" ? entry : entry.id;
}
