import { Container, type ServiceIdentifier } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AnyObject, Optional } from "../types/general";

import { useIocContext } from "./use-ioc-context";

/**
 * Resolves a value from the container if bound, returning null otherwise.
 * Unlike {@link useInjection}, this hook does not throw when the token is not bound.
 *
 * @group provision
 *
 * @param injectionId - Injection identifier.
 * @param onFallback - Optional callback to handle cases when dependency was not resolved.
 * @returns Resolved value, result of optional fallback handler or null.
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
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return container.get<T>(injectionId);
    } else if (onFallback) {
      dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
        token: injectionId,
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return onFallback(container);
    } else {
      dbg.info(prefix(__filename), "Injection not found, returning null:", {
        token: injectionId,
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return null;
    }
  }, [container, revision, injectionId]);
}
