import { Tag } from "@/panel/components/ui";
import { BindingStatus } from "@/panel/lib/selectors";

interface DetailStatusTagProps {
  readonly status: BindingStatus;
}

/**
 * A lifecycle chip for a singleton instance binding (`active` / `inactive` / `unrealized`).
 */
export function DetailStatusTag({ status }: DetailStatusTagProps) {
  return (
    <Tag tone={status === BindingStatus.Active ? "ok" : status === BindingStatus.Inactive ? "muted" : "warn"}>
      {status}
    </Tag>
  );
}
