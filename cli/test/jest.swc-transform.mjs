export function swcTransform(decoratorOptions) {
  return [
    "@swc/jest",
    {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
          decorators: true,
        },
        transform: {
          react: { runtime: "automatic" },
          useDefineForClassFields: false,
          ...decoratorOptions,
        },
        target: "es2022",
        keepClassNames: true,
      },
      module: { type: "commonjs" },
    },
  ];
}
