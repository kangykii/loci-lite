import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

type EditorTitleFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function EditorTitleField({ value, onChange }: EditorTitleFieldProps) {
  const [editor] = useLexicalComposerContext();

  return (
    <input
      aria-label="Note title"
      className="editor-title"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') {
          return;
        }

        event.preventDefault();
        editor.focus(() => {
          editor.update(() => {
            $getRoot().selectStart();
          });
        });
      }}
      placeholder="Untitled"
      type="text"
      value={value}
    />
  );
}
