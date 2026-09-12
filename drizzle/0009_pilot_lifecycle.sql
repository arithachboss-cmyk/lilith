-- Mock-only terminal receipts contain no form, image, contact or attribution data.
-- Keep them until isolated test-namespace teardown to prevent replay resurrection.
CREATE TABLE pilot_closures (
 draft_id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 reason TEXT NOT NULL CHECK(reason IN ('withdrawn','deleted','expired')),
 closed_at TEXT NOT NULL, mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE INDEX pilot_drafts_expiry ON pilot_drafts(expires_at);
CREATE TRIGGER pilot_no_recreated_session BEFORE INSERT ON pilot_drafts
WHEN EXISTS (SELECT 1 FROM pilot_closures WHERE draft_id=NEW.id OR token_hash=NEW.token_hash)
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_lead_insert BEFORE INSERT ON pilot_leads
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_lead_update BEFORE UPDATE ON pilot_leads
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_image_insert BEFORE INSERT ON pilot_images
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_image_update BEFORE UPDATE ON pilot_images
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
CREATE TRIGGER pilot_active_event_insert BEFORE INSERT ON pilot_events
WHEN NOT EXISTS (SELECT 1 FROM pilot_drafts WHERE id=NEW.draft_id AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))
BEGIN SELECT RAISE(ABORT, 'PILOT_SESSION_CLOSED'); END;
