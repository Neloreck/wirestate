import { validateStandardMethodContext } from "../../metadata/metadata-decorator-context";
import {
  appendHandlerMetadata,
  appendStandardHandlerMetadata,
  collectHandlerMetadata,
} from "../../metadata/metadata-handlers";
import {
  MESSAGING_REGISTRATION_KEY,
  MESSAGING_REGISTRATIONS,
  type MessagingRegistration,
} from "../messaging-registration";

import type { QueryHandler, QueryHandlerMetadata, QueryType } from "./queries";
import { QUERY_HANDLER_METADATA, QUERY_METADATA_KEY } from "./queries-registry";
import { QueryBus } from "./query-bus";

/**
 * Wires an instance's `@OnQuery` methods onto the {@link QueryBus}.
 *
 * @remarks
 * Declared beside the queries code so importing `@OnQuery` (or {@link QueriesPlugin})
 * is what pulls {@link QueryBus} into the bundle; the dispatcher stays bus-agnostic.
 *
 * @internal
 */
export const QUERY_REGISTRATION: MessagingRegistration = {
  kind: Symbol("@wirestate/core/messaging/query"),
  token: QueryBus,
  register: (bus: object, instance: object): Array<() => void> => {
    const queryBus: QueryBus = bus as QueryBus;
    const disposers: Array<() => void> = [];

    for (const meta of getQueryHandlerMetadata(instance)) {
      const method: unknown = (instance as Record<string | symbol, unknown>)[meta.methodName];

      if (typeof method !== "function") {
        continue;
      }

      disposers.push(queryBus.register(meta.type, (method as QueryHandler).bind(instance)));
    }

    return disposers;
  },
};

/**
 * Describes the decorator returned by {@link OnQuery}.
 *
 * @remarks
 * Supports both TC39 and legacy experimental decorators.
 *
 * @group Queries
 */
export interface OnQueryHandlerDecorator {
  // Standard (TC39):
  <This>(value: (this: This, ...args: Array<never>) => unknown, context: ClassMethodDecoratorContext<This>): void;
  // Legacy/experimental:
  (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): void;
}

/**
 * Marks a service method as a query handler.
 *
 * @remarks
 * The handler is registered when the owning container is provisioned and
 * unregistered when that provision cycle ends. Register {@link QueriesPlugin}
 * on the container, or on an ancestor container, to enable query handlers.
 *
 * Queries answer read-oriented requests. If several handlers use the same
 * token, the newest registered handler answers.
 *
 * @group Queries
 *
 * @param type - Query token.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
 * import { Injectable, OnQuery } from "@wirestate/core";
 *
 * @Injectable()
 * class UserProfileService {
 *   @OnQuery("GET_USER_AVATAR")
 *   private async onGetUserAvatar(userId: string): Promise<string> {
 *     const user: User = await this.userRepository.findById(userId);
 *
 *     return user.avatarUrl;
 *   }
 * }
 * ```
 */
export function OnQuery(type: QueryType): OnQueryHandlerDecorator {
  return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      const metadata: DecoratorMetadataObject = validateStandardMethodContext("OnQuery", nameOrContext);

      appendStandardHandlerMetadata(metadata, QUERY_METADATA_KEY, { methodName: nameOrContext.name, type });
      appendStandardHandlerMetadata(metadata, MESSAGING_REGISTRATION_KEY, QUERY_REGISTRATION);
    } else {
      // Experimental legacy decorators:

      appendHandlerMetadata(QUERY_HANDLER_METADATA, target.constructor, { methodName: nameOrContext, type });
      appendHandlerMetadata(MESSAGING_REGISTRATIONS, target.constructor, QUERY_REGISTRATION);
    }
  }) as OnQueryHandlerDecorator;
}

/**
 * Retrieves `@OnQuery` metadata from the class hierarchy.
 *
 * @remarks
 * Traverses the prototype chain to collect all query handlers.
 * Returns metadata ordered from base class to derived class to ensure parent-first execution.
 *
 * @group Queries
 * @internal
 *
 * @param instance - The instance to scan for query handlers.
 * @returns A read-only array of query handler metadata, ordered from base to derived class.
 */
export function getQueryHandlerMetadata(instance: object): ReadonlyArray<QueryHandlerMetadata> {
  return collectHandlerMetadata(instance, QUERY_HANDLER_METADATA, QUERY_METADATA_KEY);
}
