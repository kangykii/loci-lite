ALTER TABLE atoms ADD COLUMN type TEXT NOT NULL DEFAULT 'note'
  CHECK(type IN ('definition', 'note', 'reminder'));
