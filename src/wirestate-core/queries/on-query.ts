import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { QUERY_HANDLER_METADATA } from "../registry";
import { Maybe } from "../types/general";
import { QueryHandlerMetadata, QueryType } from "../types/queries";

/**
 * Marks a method as a query handler.
 *
 * @remarks
 * The handler registers when the instance activates and unregisters when the
 * instance deactivates.
 *
 * Queries answer reads. If several handlers use the same token, the newest one
 * answers. Think stack of sticky notes: read the top note first.
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
