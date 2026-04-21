import { type ServiceIdentifier } from "inversify";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import type { Optional, TAnyObject } from "@/wirestate/types/general";

/**
 * Resolves a value from the container if bound, returning null otherwise.
 * Unlike {@link useInjection}, this hook does not throw when the token is not bound.
 *
 * @param injectionId - injection identifier
 * @returns resolved value or null
 */
export function useOptionalInjection<T>(injectionId: ServiceIdentifier<T>): Optional<T> {
  const { container, revision } = useIocContext();

  // Revision bump signals a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    if (container.isBound(injectionId)) {
      dbg.info(prefix(__filename), "Resolving token:", {
        token: injectionId,
        name: (injectionId as TAnyObject)?.name ?? injectionId,
        revision,
        container,
      });

      return container.get<T>(injectionId);
    } else {
      dbg.info(prefix(__filename), "Token not bound, returning null:", {
        token: injectionId,
        name: (injectionId as TAnyObject)?.name ?? injectionId,
        revision,
        container,
      });

      return null;
    }
  }, [container, revision, injectionId]);
}
