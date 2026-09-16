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
  EditorChromeProvider,
  emptyEditorChromeContext,
  type EditorChromeContextValue,
} from './context/EditorChromeContext';
import { createEditorConfig } from './config/lexicalConfig';
import EditorTitleField from './EditorTitleField';
import AtomDecorationPlugin from './plugins/AtomDecorationPlugin';
import AtomHoverPlugin from './plugins/AtomHoverPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DefinitionScanPlugin from './plugins/DefinitionScanPlugin';
import DefinitionShortcutPlugin from './plugins/DefinitionShortcutPlugin';
import FocusModePlugin from './plugins/FocusModePlugin';
import NewNoteActionsPlugin from './plugins/NewNoteActionsPlugin';
import TypewriterScrollPlugin from './plugins/TypewriterScrollPlugin';
import MarkdownPlugin from './plugins/MarkdownPlugin';
import PasteSpacingPlugin from './plugins/PasteSpacingPlugin';
import PersistPlugin from './plugins/PersistPlugin';
import ReferencePlugin from './plugins/ReferencePlugin';
import SelectionSyncPlugin from './plugins/SelectionSyncPlugin';
import SmartMarkdownPastePlugin from './plugins/SmartMarkdownPastePlugin';

type EditorProps = {
  initialMarkdown?: string;
  onSave?: (markdown: string) => void | Promise<void>;
  atomEditor?: AtomEditorContextValue;
  editorChrome?: EditorChromeContextValue;
  editorRootRef?: Ref<HTMLDivElement>;
  typewriterActive?: boolean;
  title?: string;
  onTitleChange?: (title: string) => void;
  onFlushReady?: (flush: (() => Promise<void>) | null) => void;
};

export default function Editor({
  initialMarkdown,
  onSave,
  atomEditor,
  editorChrome,
  editorRootRef,
  typewriterActive = false,
  title = '',
  onTitleChange,
  onFlushReady,
}: EditorProps) {
  const atomContext = atomEditor ?? emptyAtomEditorContext;
  const chromeContext = editorChrome ?? emptyEditorChromeContext;

  return (
    <AtomEditorProvider value={atomContext}>
      <EditorChromeProvider value={chromeContext}>
        <LexicalComposer initialConfig={createEditorConfig(initialMarkdown)}>
          <section className="editor-frame" aria-label="Editor surface">
            {onTitleChange ? (
              <EditorTitleField onChange={onTitleChange} value={title} />
            ) : null}
            <div className="editor-body-wrap">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    ref={editorRootRef}
                    className="editor-root"
                    aria-label="Document body"
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={<div className="editor-placeholder">Start writing here…</div>}
              />
            </div>
            {onTitleChange ? (
              <NewNoteActionsPlugin isTitleEmpty={!title.trim()} onTitleChange={onTitleChange} onOpenNewTab={chromeContext.onOpenNewTab} />
            ) : null}
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
            <MarkdownPlugin />
            <DefinitionShortcutPlugin />
            <ReferencePlugin />
            <SelectionSyncPlugin />
            <FocusModePlugin />
            <TypewriterScrollPlugin active={typewriterActive} />
            <ContextMenuPlugin />
            <SmartMarkdownPastePlugin />
            <PasteSpacingPlugin />
            <AtomDecorationPlugin />
            <DefinitionScanPlugin />
            <AtomHoverPlugin />
            {onSave ? <PersistPlugin onFlushReady={onFlushReady} onSave={onSave} /> : null}
          </section>
        </LexicalComposer>
      </EditorChromeProvider>
    </AtomEditorProvider>
  );
}
