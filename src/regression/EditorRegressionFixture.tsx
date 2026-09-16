import { useLayoutEffect, useMemo, useState } from 'react';
import OutlinePanel from '../components/editor/OutlinePanel';
import Editor from '../editor/Editor';
import {
  outlineEntriesForDisplay,
  outlineEntriesFromMarkdown,
} from '../lib/outlineNavigation';

type FixtureName = 'empty' | 'lists' | 'references';

const fixtures: Record<Exclude<FixtureName, 'empty'>, string> = {
  lists: `# Lists

## Unordered

- First item
- Second item
- Third item`,
  references: `# Research note

AGLC4 is the citation standard.[^AGLC4]

The source is retained with the note.[^Authority 2026]

## Analysis`,
};

function fixtureName(): FixtureName {
  const value = new URLSearchParams(window.location.search).get('case');
  return value === 'lists' || value === 'references' ? value : 'empty';
}

export default function EditorRegressionFixture() {
  const name = fixtureName();
  const markdown = name === 'empty' ? undefined : fixtures[name];
  const [outlineTab, setOutlineTab] = useState<'contents' | 'references'>(
    name === 'references' ? 'references' : 'contents',
  );
  const entries = useMemo(
    () => outlineEntriesForDisplay(outlineEntriesFromMarkdown(markdown ?? ''), 'Research note'),
    [markdown],
  );

  // EditorView normally adds this after its desktop document has loaded.
  // The fixture has no document-loading phase, so reveal its real editor
  // layout synchronously before Playwright takes a measurement.
  useLayoutEffect(() => {
    document.documentElement.classList.add('editor-revealed');
    return () => document.documentElement.classList.remove('editor-revealed');
  }, []);

  return (
    <main className="app-shell editor-view regression-editor-fixture">
      <div className="editor-layout">
        <Editor initialMarkdown={markdown} onSave={() => undefined} />
      </div>
      {name === 'references' ? (
        <OutlinePanel
          documentTitle="Research note"
          entries={entries}
          onClose={() => undefined}
          onNavigate={() => undefined}
          onTabChange={setOutlineTab}
          tab={outlineTab}
        />
      ) : null}
    </main>
  );
}
