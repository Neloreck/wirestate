import { type ServiceIdentifier } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AnyObject } from "../types/general";

import { useIocContext } from "./use-ioc-context";

/**
 * Resolves a value from the container - constant or service.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @group provision
 *
 * @param injectionId - injection identifier
 * @returns resolved value
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
