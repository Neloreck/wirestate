import { type ServiceIdentifier } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AnyObject } from "../types/general";

import { useIocContext } from "./use-ioc-context";

/**
 * Resolves a service or constant from the active container.
 *
 * @remarks
 * This hook automatically re-resolves the dependency if the container's
 * revision changes (e.g., due to re-binding in a provider).
 *
 * @group Provision
 *
 * @template T - The type of the value being resolved.
 *
 * @param injectionId - The service identifier (string, symbol, or constructor).
 *
 * @returns The resolved instance or value.
 *
 * @throws {WirestateError} If the container is not found in context.
 * @throws {Error} If Inversify fails to resolve the identifier.
 *
 * @example
 * ```tsx
 * const api: ApiService = useInjection(ApiService);
 * ```
 */
export function useInjection<T>(injectionId: ServiceIdentifier<T>): T {
  const { container, revision } = useIocContext();

  // Revision bump causes a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    dbg.info(prefix(__filename), "New injection provision for token:", {
      token: injectionId,
      name: (injectionId as AnyObject)?.name ?? injectionId,
      revision,
      container,
    });

    return container.get<T>(injectionId);
  }, [container, revision, injectionId]);
}
