import Skeleton from '../ui/Skeleton';

const PARAGRAPHS = [
  ['95%', '88%', '92%'],
  ['90%', '60%'],
  ['85%', '92%', '40%'],
];

type EditorSkeletonProps = {
  className?: string;
};

/** Stencil of a document page — title line + paragraph lines — shown while a note's content loads. */
export default function EditorSkeleton({ className }: EditorSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={className ? `editor-skeleton ${className}` : 'editor-skeleton'}
    >
      <Skeleton className="editor-skeleton-title" />
      {PARAGRAPHS.map((lines, pIndex) => (
        <div className="editor-skeleton-paragraph" key={pIndex}>
          {lines.map((width, lIndex) => (
            <Skeleton className="editor-skeleton-line" key={lIndex} width={width} />
          ))}
        </div>
      ))}
    </div>
  );
}
