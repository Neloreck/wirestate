import { collectHandlerMetadata } from "../../metadata/metadata-handlers";
import { type MessagingHandlerDecorator, createMessagingDecorator } from "../messaging-decorator";
import { type MessagingRegistration } from "../messaging-registration";

import { type QueryHandler, type QueryHandlerMetadata, type QueryType } from "./queries";
import { QUERY_HANDLER_METADATA, QUERY_METADATA_KEY } from "./queries-registry";
import { QueryBus } from "./query-bus";

/**
 * Wires an instance's `@OnQuery` methods onto the {@link QueryBus}.
 *
 * @remarks
 * Declared beside the queries code so importing `@OnQuery` (or {@link QueriesPlugin})
 * is what pulls {@link QueryBus} into the bundle. The dispatcher stays bus-agnostic.
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
export type OnQueryDecorator = MessagingHandlerDecorator;

const decorate = createMessagingDecorator<QueryHandlerMetadata>({
  name: "OnQuery",
  registry: QUERY_HANDLER_METADATA,
  metadataKey: QUERY_METADATA_KEY,
  registration: QUERY_REGISTRATION,
});

/**
 * Marks an injectable service method as a provision-scoped query handler.
 *
 * @remarks
 * The handler is registered when the owning container is provisioned and
 * unregistered when that provision cycle ends. Register {@link QueriesPlugin}
 * on the container, or on an ancestor container, to enable query handlers.
 *
 * Queries answer read-oriented requests. One query call goes to one handler:
 * the newest registered handler for the query token.
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
 *   private readonly avatars = new Map<string, string>();
 *
 *   @OnQuery("GET_USER_AVATAR")
 *   public onGetUserAvatar(userId: string): string {
 *     return this.avatars.get(userId) ?? "";
 *   }
 * }
 * ```
 */
export function OnQuery(type: QueryType): OnQueryDecorator {
  return decorate((methodName: string | symbol): QueryHandlerMetadata => ({ methodName, type }));
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
