ALTER TABLE files ADD COLUMN edited_at INTEGER NOT NULL DEFAULT 0;

UPDATE files SET edited_at = opened_at WHERE edited_at = 0;
