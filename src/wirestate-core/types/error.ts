import { Container } from "../base";

import { WireEvent } from "./events";

/**
 * Internal Wirestate error source.
 *
 * @group Error
 */
export type InternalErrorSource =
  | "event-handler"
  | "instance-event-handler"
  | "instance-activation"
  | "instance-deactivation"
  | "provider-provision"
  | "provider-deprovision";

/**
 * Describes an internal error that Wirestate isolates instead of rethrowing.
 *
 * @group Error
 */
export interface InternalErrorDescriptor {
  /**
   * Container that owns the failed internal work.
   */
  readonly container?: Container;

  /**
   * Extra values printed between the message and error by the default handler.
   */
  readonly details?: ReadonlyArray<unknown>;

  /**
   * Event being dispatched when an event handler failed.
   */
  readonly event?: WireEvent;

  /**
   * Original thrown or rejected value.
   */
  readonly error: unknown;

  /**
   * Message printed after the `[wirestate]` prefix by the default handler.
   */
  readonly message: string;

  /**
   * Service method that failed, when known.
   */
  readonly methodName?: string | symbol;

  /**
   * Instance that owns the failed handler, when known.
   */
  readonly instance?: object;

  /**
   * Instance class name, when known.
   */
  readonly instanceName?: string;

  /**
   * Internal subsystem that caught the failure.
   */
  readonly source: InternalErrorSource;
}

/**
 * Handles isolated internal Wirestate errors.
 *
 * @group Error
 */
export type InternalErrorHandler = (descriptor: InternalErrorDescriptor) => void;
