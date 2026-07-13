-- Run this on an existing s_peak database to add Google OAuth support.
USE s_peak;

ALTER TABLE users
  ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password_hash,
  MODIFY password_hash VARCHAR(255) NULL;
