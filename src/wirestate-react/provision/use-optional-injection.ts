import { Container, type ServiceIdentifier } from "inversify";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate-react/provision/use-ioc-context";
import type { Optional, TAnyObject } from "@/wirestate/types/general";

/**
 * Resolves a value from the container if bound, returning null otherwise.
 * Unlike {@link useInjection}, this hook does not throw when the token is not bound.
 *
 * @param injectionId - injection identifier
 * @param onFallback - optional callback to handle cases when dependency was not resolved
 * @returns resolved value, result of optional fallback handler or null
 */
export function useOptionalInjection<T>(
  injectionId: ServiceIdentifier<T>,
  onFallback?: (container: Container) => T
): Optional<T> {
  const { container, revision } = useIocContext();

  // Revision bump forces a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    if (container.isBound(injectionId)) {
      dbg.info(prefix(__filename), "Resolving injection:", {
        token: injectionId,
        name: (injectionId as TAnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return container.get<T>(injectionId);
    } else if (onFallback) {
      dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
        token: injectionId,
        name: (injectionId as TAnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return onFallback(container);
    } else {
      dbg.info(prefix(__filename), "Injection not found, returning null:", {
        token: injectionId,
        name: (injectionId as TAnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return null;
    }
  }, [container, revision, injectionId]);
}
