import { useIocContext } from "./use-ioc-context";

/**
 * Returns the current container revision number.
 *
 * @remarks
 * The revision is incremented whenever bindings in the {@link IocProvider} or
 * a descendant provider change. Hooks like {@link useInjection} use this to
 * invalidate their cache and re-resolve services.
 *
 * @group provision
 *
 * @returns The current revision number.
 */
export function useContainerRevision(): number {
  return useIocContext().revision;
}
