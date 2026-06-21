import { LinkButton } from "@/panel/components/ui";

interface FilterToContainerLinkProps {
  readonly onClick: () => void;
}

/** The "filter the Timeline to this container" cross-link shown at the foot of a detail view. */
export function FilterToContainerLink({ onClick }: FilterToContainerLinkProps) {
  return (
    <div>
      <LinkButton onClick={onClick}>⤵ Filter Timeline to this container</LinkButton>
    </div>
  );
}
