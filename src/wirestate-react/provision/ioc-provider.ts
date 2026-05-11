import { Container, applySharedSeed, createIocContainer, WirestateError } from "@wirestate/core";
import { createElement, PropsWithChildren, useEffect, useMemo, useState } from "react";

import { type IocContext, IocReactContext } from "../context/ioc-context";
import { ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER } from "../error/error-code";
import { AnyObject, Optional } from "../types/general";

/**
 * Props for {@link IocProvider}.
 *
 * @group provision
 */
export interface IocProviderProps extends PropsWithChildren<unknown> {
  /**
   * External Inversify container instance.
   * If omitted, a new container is automatically created via {@link createIocContainer}.
   */
  readonly container?: Container;
  /**
   * Shared seed data to be applied to the container.
   * This data is available to all services in the container.
   */
  readonly seed?: AnyObject;
}

/**
 * Provides an Inversify IoC container to the React component tree.
 *
 * @remarks
 * This component should be placed near the root of your application. It initializes
 * the IocReactContext, which is consumed by hooks like `useService` and `useContainer`.
 *
 * @group provision
 *
 * @param props - Component properties.
 * @param props.container - External Inversify container instance.
 * @param props.seed - Shared seed data to be applied to the container.
 * @param props.children - React children element.
 * @returns A React Context Provider element.
 *
 * @example
 * ```tsx
 * const seed = { API_URL: "https://api.example.com" };
 *
 * function Application() {
 *   return (
 *     <IocProvider seed={seed}>
 *       <HomePage />
 *     </IocProvider>
 *   );
 * }
 * ```
 */
export function IocProvider({ container: externalContainer, seed, children }: IocProviderProps) {
  // Incremented on binding changes to invalidate descendant caches (e.g., useInjection).
  const [revision, setRevision] = useState<number>(1);
  // Lazy initialize owned container if no external container is provided.
  const [ownedContainer] = useState<Optional<Container>>(() => (externalContainer ? null : createIocContainer()));

  const container = externalContainer ?? ownedContainer;

  if (!container) {
    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      "IocProvider failed to resolve a container instance."
    );
  }

  // Context value is stable unless the container or revision changes.
  const value: IocContext = useMemo<IocContext>(() => ({ container, revision, setRevision }), [container, revision]);

  useEffect(() => {
    if (seed) {
      applySharedSeed(container, seed);
    }
  }, [container]);

  return createElement(IocReactContext.Provider, { value }, children);
}
