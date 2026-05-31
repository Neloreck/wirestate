import { ServiceIdentifier } from "../alias";
import { WireScope } from "../container/wire-scope";
import { ERROR_CODE_REFLECT_METADATA_MISSING } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";
import { Maybe } from "../types/general";

interface ReflectWithMetadata {
  readonly getMetadata?: (metadataKey: string, target: object) => unknown;
}

/**
 * Describes options for {@link hasWireScopeInjection}.
 *
 * @internal
 */
export interface HasWireScopeInjectionOptions {
  /**
   * If true, missing reflect-metadata support throws a Wirestate error.
   *
   * @default false
   */
  readonly isRequired?: boolean;
}

/**
 * Checks whether a service constructor receives WireScope directly.
 *
 * @internal
 *
 * @param token - Service constructor to inspect.
 * @param options - Reflection behavior options.
 * @returns True when reflected constructor parameters include WireScope.
 */
export function hasWireScopeInjection(token: ServiceIdentifier, options: HasWireScopeInjectionOptions = {}): boolean {
  if (typeof token !== "function") {
    return false;
  }

  const getMetadata = (Reflect as ReflectWithMetadata).getMetadata;

  if (!getMetadata) {
    if (options.isRequired) {
      throw new WirestateError(
        'reflect-metadata is required for Wirestate service activation. Import "reflect-metadata" once at your application entry point before creating Wirestate containers.',
        ERROR_CODE_REFLECT_METADATA_MISSING
      );
    } else {
      return false;
    }
  }

  return Boolean(
    (getMetadata("design:paramtypes", token as object) as Maybe<Array<unknown>>)?.some((type) => type === WireScope)
  );
}
