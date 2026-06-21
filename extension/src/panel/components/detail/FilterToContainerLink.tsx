import { LinkButton } from "@/panel/components/ui";

/** The "filter the Timeline to this container" cross-link shown at the foot of a detail view. */
export function FilterToContainerLink({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <LinkButton onClick={onClick}>⤵ Filter Timeline to this container</LinkButton>
    </div>
  );
}
