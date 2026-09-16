import Skeleton from '../ui/Skeleton';

/** Flat placeholder sized like a bookmark flashcard's front face — no flip mechanics needed for a stencil. */
export default function AtomCardSkeleton() {
  return (
    <div aria-hidden="true" className="skeleton-card is-skeleton">
      <Skeleton className="skeleton-line" width="70%" />
      <Skeleton className="skeleton-line" width="90%" />
      <Skeleton className="skeleton-line" width="60%" />
    </div>
  );
}
