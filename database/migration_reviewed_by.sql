-- Add reviewed_by column to challenge_submissions
ALTER TABLE challenge_submissions ADD COLUMN reviewed_by INT NULL;
ALTER TABLE challenge_submissions ADD CONSTRAINT fk_challenge_submissions_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);
