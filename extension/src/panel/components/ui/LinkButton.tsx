import { type PropsWithChildren } from "react";

/** An inline link-styled button (for drill-in / cross-link actions). */
export function LinkButton({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) {
  return (
    <button className={"text-left text-sky-600 hover:underline dark:text-sky-400"} type={"button"} onClick={onClick}>
      {children}
    </button>
  );
}
