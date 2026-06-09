import type { Ref } from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  AtomEditorProvider,
  emptyAtomEditorContext,
  type AtomEditorContextValue,
} from './context/AtomEditorContext';
import {
  AuthorshipEditorProvider,
  emptyAuthorshipEditorContext,
  type AuthorshipEditorContextValue,
} from './context/AuthorshipEditorContext';
import {
  EditorChromeProvider,
  emptyEditorChromeContext,
  type EditorChromeContextValue,
} from './context/EditorChromeContext';
import { createEditorConfig } from './config/lexicalConfig';
import AtomDecorationPlugin from './plugins/AtomDecorationPlugin';
import AuthorshipOverlayPlugin from './plugins/AuthorshipOverlayPlugin';
import AuthorshipPlugin from './plugins/AuthorshipPlugin';
import AtomHoverPlugin from './plugins/AtomHoverPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DefinitionScanPlugin from './plugins/DefinitionScanPlugin';
import DefinitionShortcutPlugin from './plugins/DefinitionShortcutPlugin';
import FocusModePlugin from './plugins/FocusModePlugin';
import TypewriterScrollPlugin from './plugins/TypewriterScrollPlugin';
import MarkdownPlugin from './plugins/MarkdownPlugin';
import PersistPlugin from './plugins/PersistPlugin';
import SelectionSyncPlugin from './plugins/SelectionSyncPlugin';

type EditorProps = {
  initialMarkdown?: string;
  onSave?: (markdown: string) => void | Promise<void>;
  atomEditor?: AtomEditorContextValue;
  authorshipEditor?: AuthorshipEditorContextValue;
  editorChrome?: EditorChromeContextValue;
  editorRootRef?: Ref<HTMLDivElement>;
  typewriterActive?: boolean;
};

export default function Editor({
  initialMarkdown,
  onSave,
  atomEditor,
  authorshipEditor,
  editorChrome,
  editorRootRef,
  typewriterActive = false,
}: EditorProps) {
  const atomContext = atomEditor ?? emptyAtomEditorContext;
  const authorshipContext = authorshipEditor ?? emptyAuthorshipEditorContext;
  const chromeContext = editorChrome ?? emptyEditorChromeContext;

  return (
    <AtomEditorProvider value={atomContext}>
      <AuthorshipEditorProvider value={authorshipContext}>
        <EditorChromeProvider value={chromeContext}>
          <LexicalComposer initialConfig={createEditorConfig(initialMarkdown)}>
            <section className="editor-frame" aria-label="Editor surface">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    ref={editorRootRef}
                    className="editor-root"
                    aria-label="Document body"
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={null}
              />
              <HistoryPlugin />
              <AutoFocusPlugin />
              <ListPlugin />
              <MarkdownPlugin />
              <DefinitionShortcutPlugin />
              <SelectionSyncPlugin />
              <FocusModePlugin />
              <TypewriterScrollPlugin active={typewriterActive} />
              <ContextMenuPlugin />
              <AuthorshipPlugin />
              <AuthorshipOverlayPlugin />
              <AtomDecorationPlugin />
              <DefinitionScanPlugin />
              <AtomHoverPlugin />
              {onSave ? <PersistPlugin onSave={onSave} /> : null}
            </section>
          </LexicalComposer>
        </EditorChromeProvider>
      </AuthorshipEditorProvider>
    </AtomEditorProvider>
  );
}
