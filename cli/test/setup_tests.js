import React from "react";

global.React = React;

// Polyfill for TC39 decorators metadata.
if (Symbol.metadata === undefined) {
  Symbol.metadata = Symbol.for("Symbol.metadata");
}
