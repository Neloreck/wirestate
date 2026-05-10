import { CSSResult, unsafeCSS } from "lit";

import { default as inlineResetStyles } from "@/styles/reset.css?inline";

export const resetStyles: CSSResult = unsafeCSS(inlineResetStyles);
