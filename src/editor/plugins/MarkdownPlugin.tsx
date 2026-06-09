import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { markdownTransformers } from '../config/markdownTransformers';

export default function MarkdownPlugin() {
  return <MarkdownShortcutPlugin transformers={markdownTransformers} />;
}
