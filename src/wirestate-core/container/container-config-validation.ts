import type { Identifier } from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import type { ContainerConfig } from "./container";

/**
 * Checks a container config before creating a container.
 *
 * @remarks
 * Use it when an adapter stores config for later but still wants fast feedback.
 *
 * @group Container
 *
 * @param config - Container configuration to validate.
 * @throws {@link WirestateError} If `activate` references a token missing from `bindings`.
 *
 * @example
 * ```typescript
 * import { Injectable, validateContainerConfig } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * validateContainerConfig({
 *   activate: [LoggerService],
 *   bindings: [LoggerService],
 * });
 * ```
 */
export function validateContainerConfig(config: ContainerConfig): void {
  if (config.onError !== undefined && typeof config.onError !== "function") {
    throw new WirestateError("Container: 'onError' must be a function.", ERROR_CODE_VALIDATION_ERROR);
  }

  const activate: ReadonlyArray<Identifier> =
    (config.activate === true ? config.bindings?.map(getBindingToken) : config.activate) || [];

  if (!activate.length) {
    return;
  }

  if (!config.bindings?.length) {
    throw new WirestateError(
      "Supplied activation list while container bindings are not provided.",
      ERROR_CODE_VALIDATION_ERROR
    );
  }

  const bindingTokens: ReadonlySet<Identifier> = new Set(config.bindings.map(getBindingToken));

  for (const eager of activate) {
    if (!bindingTokens.has(eager)) {
      throw new WirestateError(
        `Container: '${String(eager)}' is listed in 'activate' but was not provided in 'bindings'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }
}
