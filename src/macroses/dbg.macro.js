const { createMacro } = require("babel-plugin-macros");

const PREFIX = "[WS]";

function dbg({ references, babel }) {
  const { types } = babel;
  const { dbg: dbgRefs } = references;

  const isLoggingEnabled = process.env.LIB_DEBUG_LOGGING === "true" || process.env.LIB_DEBUG_LOGGING === "1";

  if (!dbgRefs) {
    return;
  }

  dbgRefs.forEach((reference) => {
    if (types.isMemberExpression(reference.parentPath)) {
      const expression = reference.parentPath.parentPath;

      if (isLoggingEnabled) {
        const method = reference.parent.property.name;
        const args = expression.node.arguments;

        const logStatement = types.callExpression(
          types.memberExpression(types.identifier("console"), types.identifier(method)),
          [types.stringLiteral(PREFIX), ...args]
        );

        expression.replaceWith(logStatement);
      } else {
        expression.remove();
      }
    } else {
      throw new Error(
        "Logging macro call is not member expression, you should access console methods from logging object."
      );
    }
  });
}

module.exports = createMacro(dbg);
