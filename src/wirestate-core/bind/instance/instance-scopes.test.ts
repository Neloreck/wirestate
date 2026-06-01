import { Inject, Injectable } from "../../alias";
import { WireScope } from "../../container/wire-scope";
import { ERROR_CODE_REFLECT_METADATA_MISSING } from "../../error/error-code";
import { WirestateError } from "../../error/wirestate-error";

import { hasScopeInjection } from "./instance-scopes";

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
    expect(hasScopeInjection(ScopedService)).toBe(true);
  });

  it("should return false for services without WireScope injection", () => {
    expect(hasScopeInjection(PlainService)).toBe(false);
  });

  it("should return false for non-constructor tokens", () => {
    expect(hasScopeInjection("TOKEN")).toBe(false);
  });

  it("should return false when reflect-metadata is missing and metadata is not required", () => {
    const reflectMetadata: ReflectMetadata = Reflect as ReflectMetadata;
    const originalGetMetadata = reflectMetadata.getMetadata;

    try {
      delete reflectMetadata.getMetadata;

      expect(hasScopeInjection(ScopedService)).toBe(false);
    } finally {
      reflectMetadata.getMetadata = originalGetMetadata;
    }
  });

  it("should throw a readable error when reflect-metadata is required but missing", () => {
    const reflectMetadata: ReflectMetadata = Reflect as ReflectMetadata;
    const originalGetMetadata = reflectMetadata.getMetadata;

    try {
      delete reflectMetadata.getMetadata;

      expect(() => hasScopeInjection(ScopedService, { isRequired: true })).toThrow(WirestateError);
      expect(() => hasScopeInjection(ScopedService, { isRequired: true })).toThrow(
        expect.objectContaining({ code: ERROR_CODE_REFLECT_METADATA_MISSING })
      );
    } finally {
      reflectMetadata.getMetadata = originalGetMetadata;
    }
  });
});
