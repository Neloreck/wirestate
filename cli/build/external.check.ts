import { type BuildPackage } from "../config/packages";

/**
 * @param pkg - Target package to check.
 * @returns Checker whether package is external entry.
 */
export function isExternal(pkg: BuildPackage): (ext: string) => boolean {
  return (id: string) => pkg.external.some((ext) => id === ext || id.startsWith(ext + "/"));
}
