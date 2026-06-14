export type ReminderPresetId = 'tomorrow' | 'three_days' | 'one_week' | 'one_month';

type ReminderPreset = {
  id: ReminderPresetId;
  label: string;
  delayMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const REMINDER_PRESETS: ReminderPreset[] = [
  { id: 'tomorrow', label: 'Tomorrow', delayMs: DAY_MS },
  { id: 'three_days', label: '3 days', delayMs: 3 * DAY_MS },
  { id: 'one_week', label: '1 week', delayMs: 7 * DAY_MS },
  { id: 'one_month', label: '1 month', delayMs: 30 * DAY_MS },
];

export function getReminderDueAt(presetId: ReminderPresetId, now = Date.now()): number {
  const preset =
    REMINDER_PRESETS.find((entry) => entry.id === presetId) ?? REMINDER_PRESETS[0];
  return now + preset.delayMs;
}
