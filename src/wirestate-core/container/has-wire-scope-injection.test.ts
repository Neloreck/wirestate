import { Inject, Injectable } from "../alias";
import { ERROR_CODE_REFLECT_METADATA_MISSING } from "../error/error-code";
import { WirestateError } from "../error/wirestate-error";

import { hasWireScopeInjection } from "./has-wire-scope-injection";
import { WireScope } from "./wire-scope";

interface ReflectMetadata {
  getMetadata?: (metadataKey: string, target: object) => unknown;
}

describe("hasWireScopeInjection", () => {
  @Injectable()
  class ScopedService {
    public constructor(
      @Inject(WireScope)
      public readonly scope: WireScope
    ) {}
  }

  @Injectable()
  class PlainService {}

  it("should detect direct WireScope constructor injection", () => {
    expect(hasWireScopeInjection(ScopedService)).toBe(true);
  });

  it("should return false for services without WireScope injection", () => {
    expect(hasWireScopeInjection(PlainService)).toBe(false);
  });

  it("should return false for non-constructor tokens", () => {
    expect(hasWireScopeInjection("TOKEN")).toBe(false);
  });

  it("should return false when reflect-metadata is missing and metadata is not required", () => {
    const reflectMetadata: ReflectMetadata = Reflect as ReflectMetadata;
    const originalGetMetadata = reflectMetadata.getMetadata;

    try {
      delete reflectMetadata.getMetadata;

      expect(hasWireScopeInjection(ScopedService)).toBe(false);
    } finally {
      reflectMetadata.getMetadata = originalGetMetadata;
    }
  });

  it("should throw a readable error when reflect-metadata is required but missing", () => {
    const reflectMetadata: ReflectMetadata = Reflect as ReflectMetadata;
    const originalGetMetadata = reflectMetadata.getMetadata;

    try {
      delete reflectMetadata.getMetadata;

      expect(() => hasWireScopeInjection(ScopedService, { isRequired: true })).toThrow(WirestateError);
      expect(() => hasWireScopeInjection(ScopedService, { isRequired: true })).toThrow(
        expect.objectContaining({ code: ERROR_CODE_REFLECT_METADATA_MISSING })
      );
    } finally {
      reflectMetadata.getMetadata = originalGetMetadata;
    }
  });
});
