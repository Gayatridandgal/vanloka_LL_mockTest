-- Mock test schema for vanloka-postgres
-- Safe migration: creates new schema objects only and does not touch existing tables or data.

CREATE SCHEMA IF NOT EXISTS mock_test AUTHORIZATION vanloka_admin;

CREATE TABLE IF NOT EXISTS mock_test.trainee (
    mds_trainee_id uuid PRIMARY KEY,
    name text NOT NULL,
    mobile_number varchar(20) NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    best_score integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT mock_test_trainee_attempts_check CHECK (attempts >= 0),
    CONSTRAINT mock_test_trainee_best_score_check CHECK (best_score >= 0 AND best_score <= 20),
    CONSTRAINT mock_test_trainee_mds_fk FOREIGN KEY (mds_trainee_id) REFERENCES mds.mds_trainees(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mock_test_trainee_mobile_number
    ON mock_test.trainee USING btree (mobile_number);

COMMENT ON TABLE mock_test.trainee IS 'Verified trainee profile mirrored from mds.mds_trainees for mock test access only.';
COMMENT ON COLUMN mock_test.trainee.mds_trainee_id IS 'Foreign key back to the source MDS trainee record.';
COMMENT ON COLUMN mock_test.trainee.name IS 'Display name used by the mock test portal after verification.';
COMMENT ON COLUMN mock_test.trainee.mobile_number IS 'Normalized mobile number used for trainee confirmation.';
COMMENT ON COLUMN mock_test.trainee.attempts IS 'Count of mock test attempts made by this trainee.';
COMMENT ON COLUMN mock_test.trainee.best_score IS 'Best score achieved by this trainee across mock tests.';
