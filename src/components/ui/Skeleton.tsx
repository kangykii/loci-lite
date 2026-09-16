import type { CSSProperties } from 'react';

type SkeletonProps = {
  className?: string;
  width?: string;
};

/** Bare pulsing placeholder block — the shared unit every skeleton row/card composes from. */
export default function Skeleton({ className, width }: SkeletonProps) {
  const style: CSSProperties | undefined = width ? { width } : undefined;

  return (
    <span
      aria-hidden="true"
      className={className ? `skeleton-block ${className}` : 'skeleton-block'}
      style={style}
    />
  );
}
