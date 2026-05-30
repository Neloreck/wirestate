import { ServiceIdentifier, Container } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useContainer } from "../context/use-container";
import { AnyObject } from "../types/general";

/**
 * Resolves a service or constant from the active container.
 *
 * @remarks
 * This hook re-resolves the dependency when the active container or token changes.
 *
 * @group Injection
 *
 * @template T - The type of the value being resolved.
 *
 * @param token - The service token (string, symbol, or constructor).
 *
 * @returns The resolved instance or value.
 *
 * @throws {WirestateError} If the container is not found in context.
 * @throws {Error} If Inversify fails to resolve the token.
 *
 * @example
 * ```tsx
 * const api: ApiService = useInjection(ApiService);
 * ```
 */
export function useInjection<T>(token: ServiceIdentifier<T>): T {
  const container: Container = useContainer();

  // Revision bump causes a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    dbg.info(prefix(__filename), "Resolving injection:", {
      token,
      name: (token as AnyObject)?.name ?? token,
      container,
    });

    return container.get<T>(token);
  }, [container, token]);
}
