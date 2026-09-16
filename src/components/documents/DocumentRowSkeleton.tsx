import Skeleton from '../ui/Skeleton';

const TITLE_WIDTHS = ['62%', '48%', '70%', '54%'];

/** Matches DocumentRow's exact markup/classes so nothing shifts once real rows load in. */
export default function DocumentRowSkeleton({ index }: { index: number }) {
  return (
    <div aria-hidden="true" className="document-row is-skeleton">
      <span className="document-icon">
        <Skeleton className="skeleton-icon" />
      </span>
      <span className="document-copy">
        <Skeleton className="skeleton-line" width={TITLE_WIDTHS[index % TITLE_WIDTHS.length]} />
        <Skeleton className="skeleton-line" width="30%" />
      </span>
      <span className="skeleton-icon-spacer" />
    </div>
  );
}
