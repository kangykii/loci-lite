import { useCallback, useEffect, useState, type RefObject } from 'react';

import { destroyContext, playKeyClick, resumeContext } from '../editor/sound/typewriterSound';
import { markFeatureLearned } from '../store/onboarding.store';
import { useTypewriterSoundSetting } from './useTypewriterSoundSetting';

function isKeyClickKey(key: string): boolean {
  return key.length === 1 || key === 'Backspace' || key === 'Enter';
}

export function useTypewriterMode(editorRootRef: RefObject<HTMLDivElement | null>) {
  const [isActive, setIsActive] = useState(false);
  const { soundOn, soundReady, toggleSound } = useTypewriterSoundSetting();

  useEffect(() => {
    const element = editorRootRef.current;

    if (!element) {
      return;
    }

    element.classList.toggle('typewriter-active', isActive);
  }, [editorRootRef, isActive]);

  const toggle = useCallback(() => {
    setIsActive((value) => {
      if (!value) void markFeatureLearned('typewriter');
      return !value;
    });
  }, []);

  useEffect(() => {
    if (!isActive || !soundOn) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isKeyClickKey(event.key)) {
        return;
      }

      resumeContext();
      playKeyClick();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, soundOn]);

  useEffect(() => destroyContext, []);

  return { isActive, toggle, soundOn, soundReady, toggleSound };
}
