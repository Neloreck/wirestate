import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { collectHandlerMetadata } from "../../metadata/metadata-handlers";
import { QUERY_HANDLER_METADATA, QUERY_METADATA_KEY } from "../../metadata/metadata-registry";

import type { QueryHandlerMetadata } from "./queries";

/**
 * Retrieves query handler metadata for an instance by traversing its prototype chain.
 *
 * @remarks
 * This utility collects metadata registered via the {@link OnQuery} decorator.
 * It ensures that handlers are returned in parent-to-child order (base class handlers first).
 * Since queries support shadowing, child class handlers registered later will effectively
 * override parent handlers for the same query type.
 *
 * @group Queries
 * @internal
 *
 * @param instance - The instance to scan for query handlers.
 * @returns A read-only array of query handler metadata, ordered from base to derived class.
 *
 * @example
 * ```typescript
 * const metadata = getQueryHandlerMetadata(myService);
 *
 * metadata.forEach(meta => {
 *   console.log(`Method ${String(meta.methodName)} handles query ${String(meta.type)}`);
 * });
 * ```
 */
export function getQueryHandlerMetadata(instance: object): ReadonlyArray<QueryHandlerMetadata> {
  dbg.info(prefix(__filename), "Resolving instance query metadata:", { name: instance.constructor.name, instance });

  return collectHandlerMetadata(instance, QUERY_HANDLER_METADATA, QUERY_METADATA_KEY);
}
