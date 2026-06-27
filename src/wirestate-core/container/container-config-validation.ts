import type { ServiceToken } from "../binding/binding";
import { getBindingToken } from "../binding/binding-tokens";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import type { ContainerConfig } from "./container";

/**
 * Validates container construction config without creating a container.
 *
 * @remarks
 * Use it in framework adapters or tests that accept `ContainerConfig` and want
 * fast feedback before a `Container` is constructed. The same validation runs
 * in the `Container` constructor.
 *
 * @group Container
 *
 * @param config - Container configuration to validate.
 * @throws {@link WirestateError} If `onError` is not a function.
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

  const activate: ReadonlyArray<ServiceToken> =
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

  const bindingTokens: ReadonlySet<ServiceToken> = new Set(config.bindings.map(getBindingToken));

  for (const eager of activate) {
    if (!bindingTokens.has(eager)) {
      throw new WirestateError(
        `Container: '${String(eager)}' is listed in 'activate' but was not provided in 'bindings'.`,
        ERROR_CODE_VALIDATION_ERROR
      );
    }
  }
}
