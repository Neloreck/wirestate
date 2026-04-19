import { type ServiceIdentifier } from "inversify";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { TAnyObject } from "@/wirestate/types/general";

/**
 * Resolves a value from the container - constant or service.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @param injectionId - injection identifier
 * @returns resolved value
 */
export function useInjection<T>(injectionId: ServiceIdentifier<T>): T {
  const { container, revision } = useIocContext();

  // Revision bump signals a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    dbg.info(prefix(__filename), "[useInjection] new injection provision for token:", {
      token: injectionId,
      name: (injectionId as TAnyObject)?.name ?? injectionId,
      revision,
      container,
    });

    return container.get<T>(injectionId);
  }, [container, revision, injectionId]);
}
