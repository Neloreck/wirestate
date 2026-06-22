import { Tag } from "@/panel/components/ui";
import { BindingStatus } from "@/panel/lib/selectors";

interface StatusTagProps {
  readonly status: BindingStatus;
}

/**
 * A lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`).
 */
export function StatusTag({ status }: StatusTagProps) {
  return (
    <Tag tone={status === BindingStatus.Active ? "ok" : status === BindingStatus.Inactive ? "muted" : "warn"}>
      {status}
    </Tag>
  );
}
