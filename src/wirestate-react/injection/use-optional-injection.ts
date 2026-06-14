import { Container, ServiceToken } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AnyObject } from "../types/general";

/**
 * Safely resolves a value from the container, returning a fallback or `undefined` if not bound.
 *
 * @remarks
 * Unlike {@link useInjection}, this hook does not throw if the dependency
 * is missing from the container.
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 * @template F - The type returned by the fallback function.
 *
 * @param token - The token (string, symbol, or constructor).
 * @param fallback - Optional function called to provide a value if the token is not bound.
 *
 * @returns The resolved value, the result of the fallback function, or `undefined` when no fallback is provided.
 *
 * @example
 * ```tsx
 * const logger = useOptionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService));
 * ```
 */
export function useOptionalInjection<T, F = undefined>(
  token: ServiceToken<T>,
  fallback?: (container: Container) => F
): T | F {
  const container: Container = useContainer();

  // Revision bump forces a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    if (container.has(token)) {
      dbg.info(prefix(__filename), "Resolving injection:", {
        token,
        name: (token as AnyObject)?.name ?? token,
        container,
        fallback,
      });

      return container.get<T>(token);
    } else if (fallback) {
      dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
        token,
        name: (token as AnyObject)?.name ?? token,
        container,
        fallback,
      });

      return fallback(container);
    } else {
      dbg.info(prefix(__filename), "Injection not found, returning undefined:", {
        token,
        name: (token as AnyObject)?.name ?? token,
        container,
        fallback,
      });

      return undefined as F;
    }
  }, [container, token]);
}
