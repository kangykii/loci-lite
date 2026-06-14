import { initDb } from '../store/db';
import { touchOpenedAt } from '../store/files.store';
import {
  listDueUnsurfacedReminders,
  markRemindersSurfaced,
} from '../store/atoms.store';

export async function resurfaceDueReminders(now = Date.now()): Promise<number> {
  await initDb();

  const dueReminders = await listDueUnsurfacedReminders(now);
  if (dueReminders.length === 0) {
    return 0;
  }

  const fileIds = [...new Set(dueReminders.map((atom) => atom.fileId))];
  await Promise.all(fileIds.map((fileId) => touchOpenedAt(fileId, now)));
  await markRemindersSurfaced(
    dueReminders.map((atom) => atom.id),
    now,
  );

  return dueReminders.length;
}
