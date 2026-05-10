import { useIocContext } from "./use-ioc-context";

/**
 * Returns the current container revision.
 *
 * @group provision
 *
 * @returns Revision number.
 */
export function useContainerRevision(): number {
  return useIocContext().revision;
}
