import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { appendHandlerMetadata, appendStandardHandlerMetadata } from "../../metadata/metadata-handlers";
import { QUERY_HANDLER_METADATA, QUERY_METADATA_KEY } from "../../metadata/registry";
import { validateStandardMethodContext } from "../../metadata/standard-decorator-context";

import type { QueryType } from "./queries";

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
export function OnQuery(type: QueryType): OnQueryHandlerDecorator {
  return ((target: object, nameOrContext: string | symbol | ClassMethodDecoratorContext): void => {
    if (typeof nameOrContext === "object") {
      // Standard decorators:
      const metadata: DecoratorMetadataObject = validateStandardMethodContext("OnQuery", nameOrContext);

      dbg.info(prefix(__filename), "Attaching OnQuery metadata (TC39):", {
        type,
        propertyKey: nameOrContext.name,
        context: nameOrContext,
      });

      appendStandardHandlerMetadata(metadata, QUERY_METADATA_KEY, { methodName: nameOrContext.name, type });
    } else {
      // Experimental legacy decorators:
      dbg.info(prefix(__filename), "Attaching OnQuery metadata:", {
        name: target.constructor.name,
        type,
        propertyKey: nameOrContext,
        target,
        constructor: target.constructor,
      });

      appendHandlerMetadata(QUERY_HANDLER_METADATA, target.constructor, { methodName: nameOrContext, type });
    }
  }) as OnQueryHandlerDecorator;
}
