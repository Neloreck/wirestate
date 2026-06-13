import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { InternalErrorSource, reportWirestateInternalError } from "../error/internal-error-handler";
import type { MaybePromise } from "../types/general";

import type { ContainerKernel } from "./container-kernel";

export interface CallLifecycleHandlerOptions {
  /**
   * Arguments passed to the lifecycle method.
   */
  readonly args?: ReadonlyArray<unknown>;

  /**
   * ContainerKernel that owns the lifecycle handler.
   */
  readonly container?: ContainerKernel;

  /**
   * Lifecycle name used in diagnostics.
   */
  readonly name: string;

  /**
   * Extra error-handler details.
   */
  readonly details?: ReadonlyArray<unknown>;

  /**
   * Instance that owns the lifecycle handler.
   */
  readonly instance: object;

  /**
   * Instance class name used in diagnostics.
   */
  readonly instanceName?: string;

  /**
   * Handler method name.
   */
  readonly methodName: string | symbol;

  /**
   * Whether synchronous failures should be rethrown after reporting.
   */
  readonly rethrowSync?: boolean;

  /**
   * Internal error source used for sync failures and async rejections.
   */
  readonly source: InternalErrorSource;

  /**
   * Message used when the handler throws synchronously.
   */
  readonly syncFailureMessage?: string;
}

/**
 * Calls a lifecycle handler and reports synchronous failures and asynchronous rejections.
 *
 * @remarks
 * Synchronous failures are always reported before optionally being rethrown.
 * Async rejections are reported from the returned promise and are never rethrown
 * into the original lifecycle call stack.
 *
 * @group Lifecycle
 * @internal
 *
 * @param options - Lifecycle handler call options.
 */
export function callLifecycleHandler(options: CallLifecycleHandlerOptions): void {
  const { args, container, name, instance, methodName, rethrowSync, source } = options;
  const details: ReadonlyArray<unknown> = options.details ?? [instance.constructor.name, String(methodName)];
  const instanceName: string = options.instanceName ?? instance.constructor.name;
  const method: unknown = (instance as Record<string | symbol, unknown>)[methodName];
  const syncFailureMessage: string = options.syncFailureMessage ?? name + " failed";

  if (typeof method !== "function") {
    return;
  }

  dbg.info(prefix(__filename), "Calling lifecycle handler:", {
    name: instanceName,
    instance,
    methodName,
    decoratorName: name,
    source,
  });

  try {
    const result: MaybePromise<void> = (method as (...args: Array<unknown>) => MaybePromise<void>).call(
      instance,
      ...(args ?? [])
    );

    if (result && typeof (result as Promise<void>).then === "function") {
      (result as Promise<void>).catch((error) => {
        reportWirestateInternalError({
          container,
          details,
          error,
          message: name + " rejected",
          methodName,
          instance,
          instanceName,
          source,
        });
      });
    }
  } catch (error) {
    reportWirestateInternalError({
      container,
      details,
      error,
      message: syncFailureMessage,
      methodName,
      instance,
      instanceName,
      source,
    });

    if (rethrowSync) {
      throw error;
    }
  }
}
