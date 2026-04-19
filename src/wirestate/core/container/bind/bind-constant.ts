import { Container, type ServiceIdentifier } from "inversify";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

export interface IBindConstantOptions {
  isWithBindingCheck?: boolean;
}

/**
 * Binds a constant value to a token in the container.
 *
 * @param container - target Inversify container
 * @param token - service identifier
 * @param value - constant value to bind
 * @param options - options object to control binding flow
 */
export function bindConstant<T>(
  container: Container,
  token: ServiceIdentifier<T>,
  value: T,
  options: IBindConstantOptions = {}
): void {
  dbg.info(prefix(__filename), "Binding constant:", {
    token,
    value,
    options,
    container,
  });

  if (options.isWithBindingCheck && container.isBound(token)) {
    dbg.info(prefix(__filename), "Skip binding constant, bound already:", {
      container,
      token,
      value,
    });

    return;
  }

  container.bind<T>(token).toConstantValue(value);
}
