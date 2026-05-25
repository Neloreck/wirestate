import { ServiceIdentifier } from "../alias";
import { getEntryToken } from "../bind/get-entry-token";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import type { ContainerConfig } from "./create-container";

/**
 * Checks a container config before creating a container.
 *
 * @remarks
 * Use it when an adapter stores config for later but still wants fast feedback.
 *
 * @group Container
 *
 * @param config - Container configuration to validate.
 * @throws {@link WirestateError} If `activate` references a token missing from `entries`.
 *
 * @example
 * ```typescript
 * import { Injectable, validateContainerConfig } from "@wirestate/core";
 *
 * @Injectable()
 * class LoggerService {}
 *
 * validateContainerConfig({
 *   entries: [LoggerService],
 *   activate: [LoggerService],
 * });
 * ```
 */
export function validateContainerConfig(config: ContainerConfig): void {
  const activate: ReadonlyArray<ServiceIdentifier> =
    (config.activate === true ? config.entries?.map(getEntryToken) : config.activate) || [];

  if (!activate.length) {
    return;
  }

  if (!config.entries?.length) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "Supplied activation list while entries for binding are not provided."
    );
  }

  const entryTokens: ReadonlyArray<ServiceIdentifier> = config.entries.map(getEntryToken);

  for (const eager of activate) {
    if (!entryTokens.includes(eager)) {
      throw new WirestateError(
        ERROR_CODE_VALIDATION_ERROR,
        `createContainer: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`
      );
    }
  }
}
