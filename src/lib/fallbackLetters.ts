import type { LearnableFeature } from '../store/onboarding.store';
import {
  AFTERNOON_LETTERS,
  AMBIENT_GREETINGS,
  AMBIENT_TIMED_LETTERS,
  MORNING_LETTERS,
  type TimedLetter,
} from './fallbackLetterContent';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const EVENING_LETTERS: TimedLetter[] = [
  {
    greeting: 'Good evening',
    body: "Evening is good for closing things.\nWhat did you mean to finish today that is still open?",
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good evening',
    body: 'If you are writing something long tonight, typewriter mode can keep the line steady.',
    sign: 'Ctrl/Cmd+Shift+T to try typewriter mode',
    teaches: 'typewriter',
  },
  {
    greeting: 'Good evening',
    body: 'Authorship mode shows what you wrote and what arrived from elsewhere.',
    sign: 'Ctrl/Cmd+Shift+A to try authorship mode',
    teaches: 'authorship',
  },
  {
    greeting: 'Good evening',
    body: 'A note does not have to be finished to be useful.\nSome of the best ones are just a paragraph that knew what it was.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good evening',
    body: 'Bookmark the passage you are proudest of today.\nIt is worth keeping.',
    sign: 'Right-click any selection to bookmark it',
    teaches: 'bookmarks',
  },
];

const NIGHT_LETTERS: TimedLetter[] = [
  {
    greeting: 'Writing late',
    body: 'The thoughts that come at this hour are different.\nWrite them down before they are gone.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Still here',
    body: 'Focus mode helps when everything else is a distraction.\nLet the rest of the screen go quiet.',
    sign: 'Ctrl/Cmd+Shift+F to try focus mode',
    teaches: 'focus',
  },
  {
    greeting: 'One more thing',
    body: 'The note you have been putting off all day is easiest to start when you are too tired to overthink it.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Late night',
    body: 'Your notes are saved automatically.\nClose the lid whenever you are done.',
    sign: null,
    teaches: null,
  },
];

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDayIndex(arr: unknown[]): number {
  return new Date().getDate() % arr.length;
}

export function getAmbientGreeting(): string {
  return AMBIENT_GREETINGS[getDayIndex(AMBIENT_GREETINGS)];
}

export function selectLetter(
  daysSinceInstall: number,
  learnedFeatures: Set<LearnableFeature>,
  timeOfDay: TimeOfDay,
): TimedLetter {
  if (daysSinceInstall >= 8) {
    return AMBIENT_TIMED_LETTERS[getDayIndex(AMBIENT_TIMED_LETTERS)];
  }

  const sets: Record<TimeOfDay, TimedLetter[]> = {
    morning: MORNING_LETTERS,
    afternoon: AFTERNOON_LETTERS,
    evening: EVENING_LETTERS,
    night: NIGHT_LETTERS,
  };
  const pool = sets[timeOfDay];
  const startIndex = getDayIndex(pool);

  for (let offset = 0; offset < pool.length; offset += 1) {
    const letter = pool[(startIndex + offset) % pool.length];
    if (letter.teaches === null || !learnedFeatures.has(letter.teaches)) {
      return letter;
    }
  }

  return AMBIENT_TIMED_LETTERS[getDayIndex(AMBIENT_TIMED_LETTERS)];
}

export type { TimedLetter };
