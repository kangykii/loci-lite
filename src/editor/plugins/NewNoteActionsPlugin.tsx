import { $convertFromMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useCallback, useEffect, useState, type DragEvent } from 'react';
import ExtractDialog, { type ExtractSubmission } from '../../components/editor/ExtractDialog';
import NewNoteActions from '../../components/editor/NewNoteActions';
import { titleFromUploadFilename } from '../../lib/documentMeta';
import {
  extractPastedText,
  extractPdfBytes,
  extractPdfText,
  extractUrlText,
  pickPdfFile,
} from '../../lib/tauri';
import { markdownTransformers } from '../config/markdownTransformers';

type NewNoteActionsPluginProps = {
  isTitleEmpty: boolean;
  onTitleChange?: (title: string) => void;
  onOpenNewTab?: () => void;
};

export default function NewNoteActionsPlugin({
  isTitleEmpty,
  onTitleChange,
  onOpenNewTab,
}: NewNoteActionsPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBodyEmpty, setIsBodyEmpty] = useState(() =>
    editor.getEditorState().read(() => $getRoot().getTextContent().length === 0),
  );
  const [isExtractOpen, setIsExtractOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        setIsBodyEmpty($getRoot().getTextContent().length === 0);
      });
    });
  }, [editor]);

  const insertMarkdown = useCallback(
    (markdown: string) => {
      editor.update(() => {
        $getRoot().clear();
        $convertFromMarkdownString(markdown, markdownTransformers, undefined, true);
      });
    },
    [editor],
  );

  const applyExtraction = useCallback(
    (text: string, title?: string | null) => {
      insertMarkdown(text);

      if (title && title.trim()) {
        onTitleChange?.(title.trim());
      }
    },
    [insertMarkdown, onTitleChange],
  );

  const handleUpload = useCallback(async () => {
    setError(null);

    try {
      const path = await pickPdfFile();

      if (!path) {
        return;
      }

      setIsBusy(true);
      const text = await extractPdfText(path);
      const filename = path.split(/[/\\]/).pop() ?? '';
      applyExtraction(text, titleFromUploadFilename(filename));
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to extract document text';
      setError(message);
    } finally {
      setIsBusy(false);
    }
  }, [applyExtraction]);

  const handleDroppedFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported.');
        return;
      }

      setIsBusy(true);

      try {
        const buffer = await file.arrayBuffer();
        const text = await extractPdfBytes(new Uint8Array(buffer));
        applyExtraction(text, titleFromUploadFilename(file.name));
      } catch (cause: unknown) {
        const message =
          cause instanceof Error ? cause.message : 'Failed to extract document text';
        setError(message);
      } finally {
        setIsBusy(false);
      }
    },
    [applyExtraction],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLButtonElement>) => {
    if (!event.dataTransfer.types.includes('Files')) {
      return;
    }

    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer.files[0];

      if (file) {
        void handleDroppedFile(file);
      }
    },
    [handleDroppedFile],
  );

  const handleExtractSubmit = useCallback(
    async ({ mode, value }: ExtractSubmission) => {
      setError(null);
      setIsBusy(true);

      try {
        const result =
          mode === 'link' ? await extractUrlText(value) : await extractPastedText(value);
        applyExtraction(result.text, result.title);
        setIsExtractOpen(false);
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : 'Failed to extract text';
        setError(message);
      } finally {
        setIsBusy(false);
      }
    },
    [applyExtraction],
  );

  if (!isTitleEmpty || !isBodyEmpty) {
    return null;
  }

  return (
    <>
      <NewNoteActions
        error={error}
        isBusy={isBusy}
        isDragOver={isDragOver}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onExtract={() => {
          setError(null);
          setIsExtractOpen(true);
        }}
        onUpload={() => void handleUpload()}
        onOpenNewTab={onOpenNewTab}
      />
      <ExtractDialog
        error={error}
        isOpen={isExtractOpen}
        isSubmitting={isBusy}
        onCancel={() => setIsExtractOpen(false)}
        onSubmit={(submission) => void handleExtractSubmit(submission)}
      />
    </>
  );
}
