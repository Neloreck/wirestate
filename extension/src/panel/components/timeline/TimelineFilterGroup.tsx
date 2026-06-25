import { type ReactNode } from "react";

interface TimelineFilterGroupProps {
  label?: string;
  children: ReactNode;
}

export function TimelineFilterGroup({ label, children }: TimelineFilterGroupProps) {
  return (
    <div className={"flex flex-nowrap items-center gap-1.5"}>
      {label ? <span className={"text-fg-subtle"}>{label}</span> : null}

      {children}
    </div>
  );
}
