/**
 * Description of the symbol MobX stores decorator annotations under on a class prototype.
 *
 * @remarks
 * MobX does not export the symbol itself. It is created with `Symbol("mobx-stored-annotations")`
 * once per MobX copy, so matching by description is the only way to recognize it across copies.
 */
const STORED_ANNOTATIONS_DESCRIPTION: string = "mobx-stored-annotations";

/**
 * Returns whether any class in the instance's hierarchy recorded MobX decorator annotations.
 *
 * @remarks
 * Only legacy experimental decorators record annotations. TC39 standard decorators apply themselves
 * during instance initialization and store nothing, so they always answer `false`.
 *
 * @param instance - Service instance to inspect.
 * @returns Whether `makeObservable` has annotations to apply.
 */
export function hasStoredAnnotations(instance: object): boolean {
  let prototype = Object.getPrototypeOf(instance);

  while (prototype && prototype !== Object.prototype) {
    for (const symbol of Object.getOwnPropertySymbols(prototype)) {
      if (symbol.description === STORED_ANNOTATIONS_DESCRIPTION) {
        return true;
      }
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return false;
}
