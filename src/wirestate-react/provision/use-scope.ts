import { WireScope } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "./use-ioc-context";

/**
 * Returns a {@link WireScope} instance bound to the active container.
 *
 * @remarks
 * The scope is recreated if the container changes. It provides a convenient
 * way to access container features like events, commands, and queries.
 *
 * @group Provision
 *
 * @returns A {@link WireScope} instance.
 *
 * @example
 * ```tsx
 * const scope: WireScope = useScope();
 *
 * scope.emitEvent("UI_READY");
 * ```
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
