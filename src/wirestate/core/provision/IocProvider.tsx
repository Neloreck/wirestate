import type { Container } from "inversify";
import { type FC, type ReactNode, useMemo, useState } from "react";

import { createIocContainer } from "@/wirestate/core/container/createIocContainer";

import { type IIocContext, IocContext } from "./IocContext";

/**
 * Props for {@link IocProvider}.
 */
export interface IocProviderProps {
  /**
   * External container instance. If omitted, a new container is created.
   */
  readonly container?: Container;
  /**
   * Components to wrap.
   */
  readonly children: ReactNode;
}

/**
 * Provides an IoC container to the component tree.
 *
 * @param props - component props
 * @param props.container
 * @param props.children
 */
export const IocProvider: FC<IocProviderProps> = ({ container: externalContainer, children }) => {
  // Incremented on binding changes to invalidate descendant caches (e.g., useService).
  const [revision, setRevision] = useState<number>(0);

  // Lazy initialize owned container if no external container is provided.
  const [ownedContainer] = useState<Container | null>(() => (externalContainer ? null : createIocContainer()));

  const container = externalContainer ?? ownedContainer;

  if (!container) {
    throw new Error("[ioc] IocProvider failed to resolve a container instance.");
  }

  // Context value is stable unless the container or revision changes.
  const value = useMemo<IIocContext>(() => ({ container, revision, setRevision }), [container, revision]);

  return <IocContext.Provider value={value}>{children}</IocContext.Provider>;
};
