import { type ServiceIdentifier } from "inversify";
import { useMemo } from "react";

import { log } from "@/macroses/log.macro";
import { prefix } from "@/macroses/prefix.macro";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { TAnyObject } from "@/wirestate/types/general";

/**
 * Resolves a service instance from the container.
 * Automatically re-resolves if the container is reset or services are rebound.
 *
 * @param token - service identifier
 * @returns resolved service instance
 */
export function useService<T>(token: ServiceIdentifier<T>): T {
  const { container, revision } = useIocContext();

  // Revision bump signals a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    log.info(prefix(__filename), "[useService] new service instance provision for token:", {
      token,
      name: (token as TAnyObject)?.name ?? token,
      revision,
      container,
    });

    return container.get<T>(token);
  }, [container, revision, token]);
}
