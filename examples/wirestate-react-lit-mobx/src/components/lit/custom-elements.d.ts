import type * as React from "react";

/**
 * Declares the `<w-lit-root>` custom element for React's JSX so it can be
 * rendered with type checking.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "w-lit-root": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
