const { createMacro } = require("babel-plugin-macros");

function prefixMacro({ references, babel, state }) {
  const { types } = babel;
  const { prefix: prefixRefs } = references;

  if (!prefixRefs) {
    return;
  }

  prefixRefs.forEach((reference) => {
    if (types.isCallExpression(reference.parentPath.node)) {
      const callExpr = reference.parentPath;
      const args = callExpr.node.arguments;

      if (
        args.length === 1 &&
        (types.isStringLiteral(args[0]) || types.isIdentifier(args[0], { name: "__filename" }))
      ) {
        let prefix = "unknown";

        if (types.isStringLiteral(args[0])) {
          prefix = args[0].value.split(/[\\/]/).pop() || "unknown";
        } else if (types.isIdentifier(args[0], { name: "__filename" })) {
          const filename = state.filename || "";

          prefix = filename.split(/[\\/]/).pop() || "unknown";
        }

        callExpr.replaceWith(types.stringLiteral(`[${prefix}]`));
      } else {
        throw new Error("prefix macro expects exactly one string literal argument.");
      }
    } else {
      throw new Error("prefix must be used as a function call.");
    }
  });
}

module.exports = createMacro(prefixMacro);
