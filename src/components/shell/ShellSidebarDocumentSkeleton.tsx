import Skeleton from '../ui/Skeleton';

const NAME_WIDTHS = ['70%', '50%', '80%'];

/** Matches .shell-sidebar-document's exact markup/classes so nothing shifts once real rows load in. */
export default function ShellSidebarDocumentSkeleton({ index }: { index: number }) {
  return (
    <div aria-hidden="true" className="shell-sidebar-document is-skeleton">
      <span className="shell-sidebar-document-copy">
        <Skeleton className="skeleton-line" width={NAME_WIDTHS[index % NAME_WIDTHS.length]} />
        <Skeleton className="skeleton-line" width="45%" />
      </span>
      <span className="skeleton-icon-spacer" />
    </div>
  );
}
