CREATE TABLE pilot_drafts (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 consent_version TEXT NOT NULL, consent_at TEXT NOT NULL,
 expires_at TEXT NOT NULL, mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE TABLE pilot_leads (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL UNIQUE REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 payload_hash TEXT NOT NULL, payload TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','qualified','viewing_ready')),
 viewing_window TEXT, created_at TEXT NOT NULL,
 mock_data INTEGER NOT NULL CHECK(mock_data = 1)
);
CREATE TABLE pilot_images (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 content_hash TEXT NOT NULL, mime TEXT NOT NULL, content TEXT NOT NULL,
 position INTEGER NOT NULL CHECK(position >= 0 AND position < 4),
 created_at TEXT NOT NULL
);
CREATE TRIGGER pilot_image_cap BEFORE INSERT ON pilot_images
WHEN (SELECT COUNT(*) FROM pilot_images WHERE draft_id = NEW.draft_id) >= 4
 AND NOT EXISTS (SELECT 1 FROM pilot_images WHERE id = NEW.id)
BEGIN SELECT RAISE(ABORT, 'PILOT_IMAGE_LIMIT'); END;
CREATE TRIGGER pilot_images_immutable_insert BEFORE INSERT ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = NEW.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TRIGGER pilot_images_immutable_update BEFORE UPDATE ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = OLD.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TRIGGER pilot_images_immutable_delete BEFORE DELETE ON pilot_images
WHEN EXISTS (SELECT 1 FROM pilot_leads WHERE draft_id = OLD.draft_id)
BEGIN SELECT RAISE(ABORT, 'PILOT_LEAD_FINALIZED'); END;
CREATE TABLE pilot_outbox (
 id TEXT PRIMARY KEY, lead_id TEXT NOT NULL UNIQUE REFERENCES pilot_leads(id) ON DELETE CASCADE,
 destination TEXT NOT NULL CHECK(destination = 'mock://middle-property-operations'),
 status TEXT NOT NULL CHECK(status = 'generated_mock'), created_at TEXT NOT NULL
);
CREATE TABLE pilot_events (
 id TEXT PRIMARY KEY, draft_id TEXT NOT NULL REFERENCES pilot_drafts(id) ON DELETE CASCADE,
 lead_id TEXT REFERENCES pilot_leads(id) ON DELETE CASCADE,
 name TEXT NOT NULL CHECK(name IN ('page_view','form_start','form_submit','line_click','call_click','qualified_lead','viewing_request')),
 occurred_at TEXT NOT NULL, attribution TEXT NOT NULL, actor_id TEXT
);

CREATE TRIGGER pilot_status_no_downgrade BEFORE UPDATE OF status ON pilot_leads
WHEN OLD.status = 'viewing_ready' AND NEW.status != 'viewing_ready'
BEGIN SELECT RAISE(ABORT, 'PILOT_STATUS_CONFLICT'); END;
