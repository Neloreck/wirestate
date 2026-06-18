import { type Optional } from "../types/general";

interface SymbolWithMetadata {
  metadata?: symbol;
}

describe("metadata-symbol-polyfill", () => {
  const symbolRef: SymbolWithMetadata = Symbol as unknown as SymbolWithMetadata;
  const original: Optional<symbol> = symbolRef.metadata;

  afterEach(() => {
    symbolRef.metadata = original;
  });

  it("installs Symbol.metadata when the runtime does not define it", () => {
    delete symbolRef.metadata;

    let resolved: Optional<symbol>;

    jest.isolateModules(() => {
      resolved = (require("./metadata-symbol-polyfill") as { METADATA_SYMBOL: symbol }).METADATA_SYMBOL;
    });

    // The polyfill installs the shared registry symbol and exports it.
    expect(symbolRef.metadata).toBe(Symbol.for("Symbol.metadata"));
    expect(resolved).toBe(Symbol.for("Symbol.metadata"));
  });

  it("reuses an existing Symbol.metadata when the runtime already defines it", () => {
    const existing: symbol = Symbol("existing-metadata");

    symbolRef.metadata = existing;

    let resolved: Optional<symbol>;

    jest.isolateModules(() => {
      resolved = (require("./metadata-symbol-polyfill") as { METADATA_SYMBOL: symbol }).METADATA_SYMBOL;
    });

    expect(symbolRef.metadata).toBe(existing);
    expect(resolved).toBe(existing);
  });
});
