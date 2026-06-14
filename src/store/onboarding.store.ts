import { getDb } from './db';

export type LearnableFeature =
  | 'focus'
  | 'typewriter'
  | 'bookmarks'
  | 'authorship'
  | 'fonts'
  | 'find';

const INSTALL_DATE_KEY = 'install_date';
const DAY_MS = 86_400_000;
const FEATURES: LearnableFeature[] = [
  'focus',
  'typewriter',
  'bookmarks',
  'authorship',
  'fonts',
  'find',
];

async function getOnboardingValue(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM onboarding WHERE key = $1',
    [key],
  );

  return rows[0]?.value ?? null;
}

async function setOnboardingValue(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO onboarding (key, value, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT(key) DO UPDATE
     SET value = $2, updated_at = $3`,
    [key, value, Date.now()],
  );
}

function learnedKey(feature: LearnableFeature): string {
  return `learned_${feature}`;
}

export async function initInstallDate(): Promise<void> {
  const existing = await getOnboardingValue(INSTALL_DATE_KEY);
  if (!existing) {
    await setOnboardingValue(INSTALL_DATE_KEY, String(Date.now()));
  }
}

export async function getDaysSinceInstall(): Promise<number> {
  const value = await getOnboardingValue(INSTALL_DATE_KEY);
  const installDate = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(installDate)) return 0;

  return Math.max(0, Math.floor((Date.now() - installDate) / DAY_MS));
}

export async function markFeatureLearned(
  feature: LearnableFeature,
): Promise<void> {
  try {
    await setOnboardingValue(learnedKey(feature), String(Date.now()));
  } catch {
    // Onboarding hints must never block the action that taught them.
  }
}

export async function isFeatureLearned(
  feature: LearnableFeature,
): Promise<boolean> {
  return (await getOnboardingValue(learnedKey(feature))) !== null;
}

export async function getLearnedFeatures(): Promise<LearnableFeature[]> {
  const results = await Promise.all(
    FEATURES.map(async (feature) => ({
      feature,
      learned: await isFeatureLearned(feature),
    })),
  );

  return results
    .filter((result) => result.learned)
    .map((result) => result.feature);
}
