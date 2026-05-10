import { WireScope } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "./use-ioc-context";

/**
 * Returns the current `WireScope` instance bound to the active container.
 * Recreates scope when the container is reset or changed.
 *
 * @group provision
 *
 * @returns active wire scope
 */
export function useScope(): WireScope {
  const { container } = useIocContext();

  return useMemo(() => {
    dbg.info(prefix(__filename), "New scope provision:", {
      container,
    });

    return container.get<WireScope>(WireScope);
  }, [container]);
}
