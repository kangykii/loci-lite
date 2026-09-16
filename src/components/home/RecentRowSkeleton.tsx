import Skeleton from '../ui/Skeleton';

const NAME_WIDTHS = ['45%', '58%', '38%'];

/** Matches .recent-row's exact markup/classes so nothing shifts once real rows load in. */
export default function RecentRowSkeleton({ index }: { index: number }) {
  return (
    <div aria-hidden="true" className="recent-row is-skeleton">
      <Skeleton className="skeleton-line recent-name" width={NAME_WIDTHS[index % NAME_WIDTHS.length]} />
      <Skeleton className="skeleton-line recent-preview" width="85%" />
      <Skeleton className="skeleton-line recent-date" width="25%" />
    </div>
  );
}
