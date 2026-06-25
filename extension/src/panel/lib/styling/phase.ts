import { type DevtoolsLifecyclePhase } from "@wirestate/core/devtools";

export interface LifecyclePhasePresentation {
  /**
   * Tailwind text-color utility backed by a `--color-phase-*` token.
   */
  readonly className: string;
  /**
   * `↑` for setup phases (coming online), `↓` for teardown phases (going away).
   */
  readonly glyph: "↑" | "↓";
}

/**
 * Static, exhaustive presentation for every lifecycle phase.
 */
const LIFECYCLE_PHASE_PRESENTATION: Record<DevtoolsLifecyclePhase, LifecyclePhasePresentation> = {
  containerProvision: { className: "text-phase-container-provision", glyph: "↑" },
  provision: { className: "text-phase-provision", glyph: "↑" },
  activate: { className: "text-phase-activate", glyph: "↑" },
  deactivate: { className: "text-phase-deactivate", glyph: "↓" },
  deprovision: { className: "text-phase-deprovision", glyph: "↓" },
  containerDeprovision: { className: "text-phase-container-deprovision", glyph: "↓" },
};

/**
 * How a lifecycle phase should render: its color class and direction glyph.
 *
 * @param phase - The lifecycle phase to present.
 * @returns The phase's color class and `↑`/`↓` glyph.
 */
export function getLifecyclePhasePresentation(phase: DevtoolsLifecyclePhase): LifecyclePhasePresentation {
  return LIFECYCLE_PHASE_PRESENTATION[phase];
}
