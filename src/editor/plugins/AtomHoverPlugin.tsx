import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AtomTooltip, { type AtomTooltipData } from '../../components/atoms/AtomTooltip';
import type { AtomType } from '../../lib/atomTypes';
import { useAtomEditorContext } from '../context/AtomEditorContext';

function readAtomFromElement(element: HTMLElement): AtomTooltipData | null {
  const id = element.dataset.atomId;
  const type = element.dataset.atomType as AtomType | undefined;
  const content = element.dataset.atomContent;
  const sourceText = element.dataset.atomSource ?? element.textContent ?? '';

  if (!id || !type || !content) {
    return null;
  }

  return { id, type, content, sourceText };
}

export default function AtomHoverPlugin() {
  const [editor] = useLexicalComposerContext();
  const { requestDeleteAtom } = useAtomEditorContext();
  const [tooltip, setTooltip] = useState<{
    atom: AtomTooltipData;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-atom-id]',
      );

      if (!target || !root.contains(target)) {
        setTooltip(null);
        return;
      }

      const atom = readAtomFromElement(target);
      if (!atom) {
        setTooltip(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTooltip({
        atom,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    };

    const handlePointerLeave = (event: PointerEvent) => {
      const related = event.relatedTarget as HTMLElement | null;
      if (related?.closest('.atom-tooltip')) {
        return;
      }

      setTooltip(null);
    };

    root.addEventListener('pointermove', handlePointerMove);
    root.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [editor]);

  if (!tooltip) {
    return null;
  }

  return createPortal(
    <AtomTooltip
      atom={tooltip.atom}
      onDelete={(id) => {
        void requestDeleteAtom(id);
        setTooltip(null);
      }}
      x={tooltip.x}
      y={tooltip.y}
    />,
    document.body,
  );
}
