import { type WirestateError } from "../../error/wirestate-error";
import { type Optional, type Maybe, type MaybePromise } from "../../types/general";

/**
 * @group Messaging
 * @internal
 */
interface HandlerDescriptor {
  handler: (payload?: unknown) => unknown;
}

/**
 * Shared storage and dispatch logic for buses that route a token to one active handler.
 *
 * @remarks
 * Handlers are stacked per type: registering the same type repeatedly forms a
 * stack and the newest registration wins until it unregisters.
 *
 * @template Type - Token type used to address handlers.
 *
 * @group Messaging
 * @internal
 */
export abstract class HandlerStackBus<T extends string | symbol | number> {
  /**
   * Internal handler storage.
   * Uses a stack for each type to support shadowing.
   */
  private readonly handlers: Map<T, Array<HandlerDescriptor>> = new Map();

  /**
   * Builds the error thrown when a required dispatch finds no handler.
   *
   * @param type - Token that failed to resolve to a handler.
   * @returns The error to throw.
   */
  protected abstract createMissingHandlerError(type: T): WirestateError;

  /**
   * Checks if at least one handler is registered for the given type.
   *
   * @param type - Token to inspect.
   * @returns `true` if a handler is available, `false` otherwise.
   */
  public hasHandler(type: T): boolean {
    return Boolean(this.handlers.get(type)?.length);
  }

  /**
   * Removes all registered handlers from the bus.
   *
   * @internal
   */
  public clear(): void {
    this.handlers.clear();
  }

  /**
   * Returns the active (newest) handler for a type, or `undefined`.
   *
   * @param type - Token to inspect.
   * @returns The active handler, or `undefined` when the stack is empty.
   */
  private peek(type: T): Maybe<HandlerDescriptor["handler"]> {
    const stack: Maybe<Array<HandlerDescriptor>> = this.handlers.get(type);

    return stack?.length ? stack[stack.length - 1].handler : undefined;
  }

  /**
   * Dispatches to the active handler and returns its result as-is.
   *
   * @remarks
   * If a handler returns a Promise, that Promise is returned untouched.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token to dispatch.
   * @param payload - Payload passed to the handler.
   * @returns The handler result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   */
  protected dispatch<R, P>(type: T, payload?: P): R {
    const handler: Maybe<HandlerDescriptor["handler"]> = this.peek(type);

    if (handler) {
      return (handler as (payload: P) => R)(payload as P);
    }

    throw this.createMissingHandlerError(type);
  }

  /**
   * Dispatches to the active handler and Promise-wraps the result.
   *
   * @remarks
   * Sync values are wrapped. Async values are passed through.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token to dispatch.
   * @param payload - Payload passed to the handler.
   * @returns A Promise resolving to the handler result.
   *
   * @throws {@link WirestateError} If no handler is registered.
   */
  protected async dispatchAsync<R, P>(type: T, payload?: P): Promise<R> {
    const handler: Maybe<HandlerDescriptor["handler"]> = this.peek(type);

    if (handler) {
      return (handler as (payload: P) => MaybePromise<R>)(payload as P);
    }

    throw this.createMissingHandlerError(type);
  }

  /**
   * Dispatches to the active handler if one exists, otherwise returns `undefined`.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token to dispatch.
   * @param payload - Payload passed to the handler.
   * @returns The handler result, or `undefined` when no handler exists.
   */
  protected dispatchOptional<R, P>(type: T, payload?: P): Optional<R> {
    const handler: Maybe<HandlerDescriptor["handler"]> = this.peek(type);

    return handler ? (handler as (payload: P) => R)(payload as P) : undefined;
  }

  /**
   * Dispatches to the active handler if one exists and Promise-wraps the result,
   * otherwise resolves to `undefined`.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token to dispatch.
   * @param payload - Payload passed to the handler.
   * @returns A Promise resolving to the handler result, or `undefined` when no handler exists.
   */
  protected async dispatchOptionalAsync<R, P>(type: T, payload?: P): Promise<Optional<R>> {
    const handler: Maybe<HandlerDescriptor["handler"]> = this.peek(type);

    return handler ? (handler as (payload: P) => MaybePromise<R>)(payload as P) : undefined;
  }

  /**
   * Pushes a handler onto the stack for a type.
   *
   * @remarks
   * Multiple handlers for one type form a stack. The newest handler is active.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token the handler answers.
   * @param handler - Handler function.
   * @returns A callback that removes this exact registration.
   */
  protected registerHandler<R, P>(type: T, handler: (payload: P) => MaybePromise<R>): () => void {
    let stack: Maybe<Array<HandlerDescriptor>> = this.handlers.get(type);

    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }

    const registration: HandlerDescriptor = { handler: handler as HandlerDescriptor["handler"] };

    stack.push(registration);

    return (): void => this.removeRegistration(type, registration);
  }

  /**
   * Removes the newest registration whose handler matches by reference.
   *
   * @remarks
   * If the handler was not registered for the given type, this does nothing.
   *
   * @template R - Type of the handler result.
   * @template P - Type of the payload.
   *
   * @param type - Token whose stack to update.
   * @param handler - The handler function instance to remove.
   */
  protected unregisterHandler<R, P>(type: T, handler: (payload: P) => MaybePromise<R>): void {
    const stack: Maybe<Array<HandlerDescriptor>> = this.handlers.get(type);

    if (!stack) {
      return;
    }

    // Stacks grow by push, so the last match is the newest registration.
    for (let it: number = stack.length - 1; it >= 0; it -= 1) {
      if (stack[it].handler === (handler as HandlerDescriptor["handler"])) {
        stack.splice(it, 1);
        break;
      }
    }

    if (stack.length === 0) {
      this.handlers.delete(type);
    }
  }

  /**
   * Removes one registration by identity and drops the stack once it is empty.
   *
   * @param type - Token whose stack to update.
   * @param registration - The registration instance to remove.
   */
  private removeRegistration(type: T, registration: HandlerDescriptor): void {
    const stack: Maybe<Array<HandlerDescriptor>> = this.handlers.get(type);

    if (!stack) {
      return;
    }

    const index: number = stack.indexOf(registration);

    if (index >= 0) {
      stack.splice(index, 1);
    }

    if (stack.length === 0) {
      this.handlers.delete(type);
    }
  }
}
