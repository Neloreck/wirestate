import { useContext } from 'react';

import { type IIocContext, IocContext } from './IocContext';

/**
 * Returns the full IoC context.
 *
 * @internal
 */
export function useIocContext(): IIocContext {
  const value: IIocContext | null = useContext(IocContext);

  if (!value) {
    throw new Error(
      '[ioc] useContainer() must be called inside an <IocProvider>.',
    );
  }

  return value;
}
