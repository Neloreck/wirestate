import { type Container, type ContainerConfig } from "../container/container";
import { type ContainerKernel } from "../container/container-kernel";
import { type Optional } from "../types/general";

import { type HotSwapOwner } from "./hot-owner";
import { type HotState, getHotState } from "./hot-registry";
import { isHotConfigOutdated, remapHotConfig } from "./hot-remap";

/**
 * Styled `[wirestate]` console badge.
 *
 * @remarks
 * The mid-tone of the docs brand coral (`#cb4626` light, `#ff8e6e` dark), picked to stay
 * readable on both light and dark devtools themes, since console styling cannot follow the theme.
 */
const BADGE: string = "%c[wirestate]%c";

/**
 * Style applied to the badge span of {@link BADGE}.
 */
const BADGE_STYLE: string = "color: #e0563b; font-weight: 600;";

/**
 * Style resetting the remainder of a badge-prefixed message.
 */
const BADGE_RESET: string = "color: inherit; font-weight: inherit;";

/**
 * Requests a hot swap for every container whose classes went stale.
 *
 * @remarks
 * Called by the dev-plugin footer from a module's self-accept callback. The
 * swap itself runs in a microtask so that every module of one HMR batch
 * registers its replacement classes first, and then executes as one synchronous
 * block: teardown deepest-first, rebuild root-first, commit. Nothing can render
 * between those steps, so no component ever resolves against a torn-down
 * container.
 *
 * @group Hot
 */
export function requestHotSwap(): void {
  const state: HotState = getHotState();

  if (state.scheduled) {
    return;
  }

  state.scheduled = true;

  queueMicrotask(() => {
    state.scheduled = false;
    performHotSwap(state);
  });
}

/**
 * Rebuilds every owned container invalidated by the current dirty set.
 *
 * @param state - Shared hot-reload state.
 */
function performHotSwap(state: HotState): void {
  if (state.reloadRequired) {
    state.reloadRequired = false;
    state.dirty.clear();

    if (typeof location !== "undefined") {
      location.reload();
    }

    return;
  }

  if (state.dirty.size === 0) {
    return;
  }

  state.dirty.clear();

  const affected: Array<HotSwapOwner> = collectAffectedOwners(state);

  if (affected.length === 0) {
    return;
  }

  // Root-first order, so replacements exist before their children need them as parents.
  affected.sort((left, right) => getContainerDepth(left.container) - getContainerDepth(right.container));

  state.swapping = true;

  try {
    // Teardown deepest-first: a child's handlers may still resolve through its parent.
    for (let index = affected.length - 1; index >= 0; index--) {
      affected[index].container.deprovision();
      affected[index].container.destroy();
    }

    // Rebuild root-first, threading swapped parents into child configs. Provisioning is
    // owned by the committing provider, mirroring the ordinary mount path.
    const replaced: Map<ContainerKernel, Container> = new Map();

    for (const owner of affected) {
      const previous: Container = owner.container;
      const parent: Optional<Container> = previous.parent ? replaced.get(previous.parent) : undefined;
      const config: ContainerConfig = remapHotConfig(owner.config, parent);
      const next: Container = owner.create(config);

      replaced.set(previous, next);

      // The owner now describes the replacement. Without this the original config keeps
      // reading as outdated, and every later swap would rebuild this container again.
      owner.config = config;
      owner.container = next;
      owner.commit(next);
    }

    console.info(`${BADGE} Hot swap replaced ${affected.length} container(s).`, BADGE_STYLE, BADGE_RESET);
  } catch (error) {
    console.error(
      `${BADGE} Hot swap failed, falling back to a full reload. ` +
        "The previous containers were already torn down, so the page cannot keep running on them.",
      BADGE_STYLE,
      BADGE_RESET,
      error
    );

    if (typeof location !== "undefined") {
      location.reload();
    } else {
      throw error;
    }
  } finally {
    state.swapping = false;
  }
}

/**
 * Collects owners whose config went stale, plus every owned descendant of those containers.
 *
 * @param state - Shared hot-reload state.
 * @returns Affected owners in registration order.
 */
function collectAffectedOwners(state: HotState): Array<HotSwapOwner> {
  const owners: Array<HotSwapOwner> = [...state.owners];
  const affected: Set<HotSwapOwner> = new Set(owners.filter((owner) => isHotConfigOutdated(owner.config)));

  if (affected.size === 0) {
    return [];
  }

  const affectedContainers: Set<ContainerKernel> = new Set([...affected].map((owner) => owner.container));

  // A container parented (at any depth) to a swapped container must be rebuilt too:
  // its parent chain would otherwise dead-end in a torn-down container.
  for (const owner of owners) {
    if (affected.has(owner)) {
      continue;
    }

    for (let current: Optional<ContainerKernel> = owner.container.parent; current; current = current.parent) {
      if (affectedContainers.has(current)) {
        affected.add(owner);
        break;
      }
    }
  }

  return owners.filter((owner) => affected.has(owner));
}

/**
 * Returns the number of ancestors above a container.
 *
 * @param container - Container to measure.
 * @returns Parent chain length.
 */
function getContainerDepth(container: Container): number {
  let depth: number = 0;

  for (let current: Optional<ContainerKernel> = container.parent; current; current = current.parent) {
    depth += 1;
  }

  return depth;
}
