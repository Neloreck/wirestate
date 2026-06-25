import { type DevtoolsLifecyclePhase } from "#/devtools";

import { getLifecyclePhasePresentation } from "@/panel/lib/styling/phase";

const SETUP_PHASES: ReadonlyArray<DevtoolsLifecyclePhase> = ["containerProvision", "provision", "activate"];
const TEARDOWN_PHASES: ReadonlyArray<DevtoolsLifecyclePhase> = ["containerDeprovision", "deprovision", "deactivate"];

describe("getLifecyclePhasePresentation", () => {
  it("maps every lifecycle phase to a phase color class", () => {
    for (const phase of [...SETUP_PHASES, ...TEARDOWN_PHASES]) {
      expect(getLifecyclePhasePresentation(phase).className).toMatch(/^text-phase-/);
    }
  });

  it("rises for setup phases and falls for teardown phases", () => {
    for (const phase of SETUP_PHASES) {
      expect(getLifecyclePhasePresentation(phase).glyph).toBe("↑");
    }

    for (const phase of TEARDOWN_PHASES) {
      expect(getLifecyclePhasePresentation(phase).glyph).toBe("↓");
    }
  });
});
