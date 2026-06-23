import { cn } from "@/lib/class-name";

describe("cn", () => {
  it("joins truthy fragments with a single space", () => {
    expect(cn("flex", "items-center", "gap-1")).toBe("flex items-center gap-1");
  });

  it("preserves fragments that already contain multiple classes", () => {
    expect(cn("flex min-h-0 flex-col", "border-t border-divider")).toBe(
      "flex min-h-0 flex-col border-t border-divider"
    );
  });

  it("drops falsy values so no stray spaces remain", () => {
    expect(cn("flex", false, null, undefined, "", "gap-1")).toBe("flex gap-1");
  });

  it("returns an empty string when no fragments are truthy", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});
