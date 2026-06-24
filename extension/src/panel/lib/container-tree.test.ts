import { mockContainerSnapshot, mockRootSnapshot } from "@/fixtures/devtools";

import { buildRoots, childContainers, rootIdOfContainer } from "@/panel/lib/container-tree";

describe("buildRoots", () => {
  it("nests containers by parentContainerId and treats orphans as top-level", () => {
    const roots = [
      mockRootSnapshot(1, [
        mockContainerSnapshot(1, null),
        mockContainerSnapshot(2, 1),
        mockContainerSnapshot(3, 1),
        mockContainerSnapshot(4, 99),
      ]),
    ];
    const built = buildRoots(roots);

    expect(built).toHaveLength(1);
    expect(built[0].nodes.map((node) => node.container.containerId).sort()).toEqual([1, 4]);

    const containerNode = built[0].nodes.find((node) => node.container.containerId === 1);

    expect(containerNode?.children.map((child) => child.container.containerId).sort()).toEqual([2, 3]);
  });

  it("derives a label with id and container count", () => {
    const built = buildRoots([mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1)])]);

    expect(built[0].label).toContain("#1");
    expect(built[0].label).toContain("2 containers");
  });

  it("prefers a configured root label over the derived hint", () => {
    expect(buildRoots([mockRootSnapshot(1, [mockContainerSnapshot(1, null)], "My App")])[0].label).toBe("My App");
  });
});

describe("childContainers", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1), mockContainerSnapshot(3, 1)]),
  ];

  it("finds children by parent", () => {
    expect(
      childContainers(roots, 1)
        .map((child) => child.containerId)
        .sort()
    ).toEqual([2, 3]);
    expect(childContainers(roots, 2)).toHaveLength(0);
  });
});

describe("rootIdOfContainer", () => {
  const roots = [
    mockRootSnapshot(1, [mockContainerSnapshot(1, null), mockContainerSnapshot(2, 1)]),
    mockRootSnapshot(7, [mockContainerSnapshot(3, null)]),
  ];

  it("returns the rootId owning the container", () => {
    expect(rootIdOfContainer(roots, 2)).toBe(1);
    expect(rootIdOfContainer(roots, 3)).toBe(7);
  });

  it("returns undefined for an unknown container", () => {
    expect(rootIdOfContainer(roots, 999)).toBeUndefined();
  });
});
