import { Container, ServiceToken } from "@wirestate/core";
import { useMemo } from "react";

import { useContainer } from "../context/use-container";

/**
 * Resolves a value from the active container.
 *
 * @remarks
 * This hook re-resolves the dependency when the active container or token changes.
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 *
 * @param token - The token (string, symbol, or constructor).
 *
 * @returns The resolved instance or value.
 *
 * @throws `WirestateError` if the container is not found in context.
 * @throws {Error} If the container fails to resolve the token.
 *
 * @example
 * ```tsx
 * const api: ApiService = useInjection(ApiService);
 * ```
 */
export function useInjection<T>(token: ServiceToken<T>): T {
  const container: Container = useContainer();

  // Revision bump causes a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    return container.get<T>(token);
  }, [container, token]);
}
