import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";

/**
 * Returns the current container revision.
 *
 * @returns revision number
 */
export function useContainerRevision(): number {
  return useIocContext().revision;
}
