import { type ReactNode } from "react";

import { cn } from "@/lib/class-name";

interface TimelineFilterGroupProps {
  grow?: boolean;
  label?: string;
  children: ReactNode;
}

export function TimelineFilterGroup({ label, grow = false, children }: TimelineFilterGroupProps) {
  return (
    <div className={cn("flex flex-nowrap items-center gap-1.5", grow ? "@max-5xl:min-w-0 @max-5xl:grow" : null)}>
      {label ? <span className={"text-fg-subtle"}>{label}</span> : null}

      {children}
    </div>
  );
}
