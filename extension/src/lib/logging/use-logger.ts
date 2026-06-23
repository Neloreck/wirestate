import { useMemo } from "react";

import { Logger } from "@/lib/logging/Logger";

/**
 * Creates a logger instance that is stable across React renders while the
 * prefix and enabled state stay unchanged.
 *
 * @param prefix - The console tag for log messages.
 * @param isEnabled - Whether this logger should emit messages.
 * @returns The memoized logger instance.
 */
export function useLogger(prefix: string, isEnabled: boolean = true): Logger {
  return useMemo(() => new Logger(prefix, isEnabled), [prefix, isEnabled]);
}
