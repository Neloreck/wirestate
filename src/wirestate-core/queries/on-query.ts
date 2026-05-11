import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "../registry";
import type { Maybe } from "../types/general";
import type { QueryHandlerMetadata, QueryType } from "../types/queries";

/**
 * Decorator for service methods that respond to a query.
 *
 * @remarks
 * Methods decorated with `@OnQuery` are automatically registered as query handlers
 * when the service is bound via {@link bindService}.
 *
 * Unlike events, queries MUST be handled by exactly one handler. If multiple handlers
 * are registered for the same query type, the most recent one (usually the most
 * specific in terms of class hierarchy or registration order) will shadow the others.
 *
 * @group queries
 *
 * @param type - Unique query identifier to handle.
 * @returns Method decorator.
 *
 * @example
 * ```typescript
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
export function OnQuery(type: QueryType): MethodDecorator {
  return (target, propertyKey) => {
    dbg.info(prefix(__filename), "Attaching OnQuery metadata:", {
      name: target.constructor.name,
      type,
      propertyKey,
      target,
      constructor: target.constructor,
    });

    const constructor = target.constructor;

    let list: Maybe<Array<QueryHandlerMetadata>> = QUERY_HANDLER_METADATA.get(constructor);

    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(constructor, list);
    }

    // Register handler metadata for prototype-based retrieval.
    list.push({ methodName: propertyKey, type });
  };
}
