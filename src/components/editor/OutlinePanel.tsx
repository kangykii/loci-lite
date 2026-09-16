import type { CSSProperties } from 'react';
import SegmentedControl from '../ui/SegmentedControl';
import type { OutlineEntry } from '../../lib/outlineNavigation';

type OutlineTab = 'contents' | 'references';

type OutlineRowStyle = CSSProperties & {
  '--outline-depth': number;
};

type OutlinePanelProps = {
  documentTitle: string;
  entries: OutlineEntry[];
  onClose: () => void;
  onNavigate: (entry: OutlineEntry) => void;
  onTabChange: (tab: OutlineTab) => void;
  tab: OutlineTab;
};

/** The document outline is intentionally shared with regression fixtures. */
export default function OutlinePanel({
  documentTitle,
  entries,
  onClose,
  onNavigate,
  onTabChange,
  tab,
}: OutlinePanelProps) {
  const activeEntries = entries.filter((entry) =>
    tab === 'contents' ? entry.kind === 'heading' : entry.kind === 'reference',
  );

  return (
    <div className="outline-layer" role="presentation">
      <button
        aria-label="Close outline"
        className="outline-scrim"
        onClick={onClose}
        type="button"
      />
      <aside aria-label={`Table of contents for ${documentTitle}`} className="outline-panel">
        <h2 className="outline-panel-title">{documentTitle}</h2>
        <SegmentedControl
          aria-label="Outline view"
          fullWidth
          onChange={onTabChange}
          options={[
            { label: 'Contents', value: 'contents' },
            { label: 'References', value: 'references' },
          ]}
          value={tab}
        />
        <nav
          aria-label={tab === 'contents' ? 'Table of contents' : 'References'}
          className="outline-nav outline-nav--enter"
          key={tab}
        >
          {activeEntries.length > 0 ? (
            activeEntries.map((entry) => (
              <button
                aria-label={
                  entry.kind === 'heading'
                    ? `H${entry.level}: ${entry.text}`
                    : `Reference ${entry.number}: ${entry.text}`
                }
                data-kind={entry.kind}
                data-level={entry.kind === 'heading' ? entry.level : undefined}
                key={`${entry.kind}-${entry.text}-${entry.index}`}
                onClick={() => onNavigate(entry)}
                style={
                  {
                    '--outline-depth': entry.kind === 'heading'
                      ? Math.min(entry.level - 1, 4)
                      : 0,
                  } as OutlineRowStyle
                }
                type="button"
              >
                {entry.kind === 'heading' ? entry.text : `${entry.number}. ${entry.text}`}
              </button>
            ))
          ) : (
            <p className="outline-empty">
              {tab === 'contents' ? 'No headings yet' : 'No references yet'}
            </p>
          )}
        </nav>
      </aside>
    </div>
  );
}
