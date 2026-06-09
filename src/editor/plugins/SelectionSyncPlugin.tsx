import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useEditorChromeContext } from '../context/EditorChromeContext';

export default function SelectionSyncPlugin() {
  const { onSelectionChange } = useEditorChromeContext();

  return (
    <OnChangePlugin
      ignoreHistoryMergeTagChange
      ignoreSelectionChange={false}
      onChange={(editorState) => {
        editorState.read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            onSelectionChange({
              hasSelection: true,
              selectedText: selection.getTextContent().trim(),
            });
            return;
          }

          onSelectionChange({
            hasSelection: false,
            selectedText: '',
          });
        });
      }}
    />
  );
}
