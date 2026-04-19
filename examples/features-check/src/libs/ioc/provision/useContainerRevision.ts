import { useIocContext } from './useIocContext';

/**
 * Returns the current container revision.
 *
 * @returns revision number
 */
export function useContainerRevision(): number {
  return useIocContext().revision;
}
