import { Container } from "inversify";

import { CONTAINER_ENTRIES } from "../registry";
import { Maybe } from "../types/general";
import { InjectableEntries } from "../types/provision";

/**
 * Records an entry as owned by a container.
 *
 * @group Container
 * @internal
 *
 * @param container - Container receiving the entry.
 * @param entry - Entry bound to the container.
 */
export function registerContainerEntry(container: Container, entry: InjectableEntries[number]): void {
  const entries: Maybe<Array<InjectableEntries[number]>> = CONTAINER_ENTRIES.get(container);

  if (entries) {
    entries.push(entry);
  } else {
    CONTAINER_ENTRIES.set(container, [entry]);
  }
}

/**
 * Returns entries recorded for a container.
 *
 * @group Container
 *
 * @param container - Container to inspect.
 * @returns Entries registered through Wirestate helpers.
 */
export function getContainerEntries(container: Container): InjectableEntries {
  return CONTAINER_ENTRIES.get(container) ?? [];
}
