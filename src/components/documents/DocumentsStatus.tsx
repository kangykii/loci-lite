type DocumentsStatusProps = {
  canCreate: boolean;
  createError?: string | null;
  documentsCount: number;
  hasActiveSearch: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  visibleCount: number;
};

export default function DocumentsStatus({
  canCreate,
  createError,
  documentsCount,
  hasActiveSearch,
  status,
  visibleCount,
}: DocumentsStatusProps) {
  return (
    <>
      {status === 'loading' ? <p className="library-status">Loading documents...</p> : null}
      {!canCreate ? (
        <p className="library-status desktop-only-hint" role="status">
          Open the Loci Notepad desktop app (<code>corepack pnpm tauri dev</code>) to create notes.
        </p>
      ) : null}
      {createError ? (
        <p className="library-status create-error" role="alert">
          Could not create note: {createError}
        </p>
      ) : null}
      {status === 'ready' && documentsCount === 0 ? (
        <p className="library-status">No documents yet.</p>
      ) : null}
      {status === 'ready' && documentsCount > 0 && hasActiveSearch && visibleCount === 0 ? (
        <p className="library-status">No documents match your search.</p>
      ) : null}
    </>
  );
}
