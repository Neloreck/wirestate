import { type DevtoolsLifecycleHook, type DevtoolsLifecyclePhase } from "#/devtools";

import { type LifecyclePhasePresentation, getLifecyclePhasePresentation } from "./phase";

/**
 * Maps each declared lifecycle hook to the dynamic phase it fires, so the static "lifecycle hooks"
 * view reuses the same color + `↑`/`↓` glyph as the "lifecycle history" event view.
 */
const LIFECYCLE_HOOK_PHASE: Record<DevtoolsLifecycleHook, DevtoolsLifecyclePhase> = {
  onActivation: "activate",
  onDeactivation: "deactivate",
  onProvision: "provision",
  onDeprovision: "deprovision",
};

/**
 * How a declared lifecycle hook should render: the color class and direction glyph of the phase it fires.
 *
 * @param hook - The lifecycle hook to present.
 * @returns The hook's color class and `↑`/`↓` glyph.
 */
export function getLifecycleHookPresentation(hook: DevtoolsLifecycleHook): LifecyclePhasePresentation {
  return getLifecyclePhasePresentation(LIFECYCLE_HOOK_PHASE[hook]);
}
