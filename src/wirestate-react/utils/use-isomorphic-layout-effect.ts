import { useEffect, useLayoutEffect } from "react";

/**
 * Uses {@link useLayoutEffect} in browser environments and {@link useEffect} during server rendering.
 *
 * @remarks
 * This avoids React server-side rendering warnings while preserving layout-effect timing in the browser.
 *
 * @group Utils
 * @internal
 */
export const useIsomorphicLayoutEffect: typeof useEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
