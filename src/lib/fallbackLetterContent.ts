import type { LearnableFeature } from '../store/onboarding.store';

export interface TimedLetter {
  greeting: string;
  body: string;
  sign: string | null;
  teaches: LearnableFeature | null;
}

export const AMBIENT_GREETINGS = [
  'Coffee and Loci?',
  'The cursor is waiting.\nSo is the idea.',
  'Some days the first sentence is the hardest one.\nWrite it anyway.',
  "A notebook doesn't judge what you put in it.\nNeither does this one.",
  'Open. Write. Close.\nThat is the whole thing.',
  'Quiet here.\nGood for thinking.',
  'You came back.\nThat is already something.',
  'Writing is thinking with better posture.',
];

export const AMBIENT_TIMED_LETTERS: TimedLetter[] = [
  {
    greeting: 'Good morning',
    body: 'Same page, same words.\nThat is enough to start.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good afternoon',
    body: 'Pick up where you left off, or start something new.\nBoth are valid.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good evening',
    body: "The day is almost done.\nWrite the thing that has been sitting in the back of your mind.",
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Still here',
    body: 'Late is fine.\nSome writing only happens at this hour.',
    sign: null,
    teaches: null,
  },
];

export const MORNING_LETTERS: TimedLetter[] = [
  {
    greeting: 'Good morning',
    body: 'The best writing happens before the day has a chance to interrupt it.\nThis is that window. Use it.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good morning',
    body: 'If you want the rest of the screen to disappear and leave only your words, focus mode does that.',
    sign: 'Ctrl/Cmd+Shift+F to try focus mode',
    teaches: 'focus',
  },
  {
    greeting: 'Good morning',
    body: 'Your notes are plain markdown files on your disk.\nNothing is locked away. Everything is yours.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good morning',
    body: 'Typewriter mode keeps your current line centered so the page moves beneath you.',
    sign: 'Ctrl/Cmd+Shift+T to try typewriter mode',
    teaches: 'typewriter',
  },
  {
    greeting: 'Good morning',
    body: 'Highlight any passage that matters, right-click, and bookmark it.\nIt will find its way back to you.',
    sign: 'Right-click any selection to bookmark it',
    teaches: 'bookmarks',
  },
];

export const AFTERNOON_LETTERS: TimedLetter[] = [
  {
    greeting: 'Good afternoon',
    body: 'Afternoon writing has a different quality.\nMore editing, less discovery. Both are useful.',
    sign: null,
    teaches: null,
  },
  {
    greeting: 'Good afternoon',
    body: 'If the words are blurring, try focus mode.\nLet everything else disappear for a bit.',
    sign: 'Ctrl/Cmd+Shift+F to try focus mode',
    teaches: 'focus',
  },
  {
    greeting: 'Good afternoon',
    body: 'The bookmark you made earlier might be worth reading again.\nCheck the Bookmarks view when you have a moment.',
    sign: 'Open Bookmarks from Home or the sidebar',
    teaches: 'bookmarks',
  },
  {
    greeting: 'Good afternoon',
    body: 'Three editor fonts are waiting in Settings: Classic, Modern, and Typewriter.',
    sign: 'Settings -> Editor -> Editor font',
    teaches: 'fonts',
  },
  {
    greeting: 'Good afternoon',
    body: 'The bottom bar can search inside the current note when you need to find your way back.',
    sign: 'Ctrl/Cmd+F to search your note',
    teaches: 'find',
  },
];
