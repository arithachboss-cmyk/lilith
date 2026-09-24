// Append-only audit record with a hash chain.
//
// Append-only is a claim that has to survive inspection, so each entry carries
// the hash of the one before it. Editing or removing an entry breaks the chain
// and verifyChain() reports where.

import { createHash } from 'node:crypto';

const GENESIS = '0'.repeat(64);

function hashEntry(entry) {
  const canonical = JSON.stringify([
    entry.seq,
    entry.at,
    entry.actor_id,
    entry.role,
    entry.module,
    entry.action,
    entry.outcome,
    entry.subject,
    entry.detail,
    entry.prev_hash,
  ]);
  return createHash('sha256').update(canonical).digest('hex');
}

export function createAuditLog({ epoch }) {
  if (!epoch) throw new Error('createAuditLog requires a deterministic epoch');
  const entries = [];
  const epochMs = Date.parse(epoch);

  return {
    /** Append one record. Returns a frozen copy; the internal array is never handed out. */
    append({ actor, module, action, outcome, subject = null, detail = null }) {
      const seq = entries.length + 1;
      const entry = {
        seq,
        // Deterministic clock: one second per recorded event, so two identical
        // runs produce identical hashes and the tests can assert on them.
        at: new Date(epochMs + seq * 1000).toISOString(),
        actor_id: actor ? actor.actor_id : null,
        role: actor ? actor.role : null,
        module,
        action,
        outcome,
        subject,
        detail,
        prev_hash: seq === 1 ? GENESIS : entries[seq - 2].hash,
      };
      entry.hash = hashEntry(entry);
      entries.push(Object.freeze(entry));
      return entry;
    },

    list() {
      return entries.slice();
    },

    head() {
      return entries.length === 0 ? GENESIS : entries[entries.length - 1].hash;
    },

    size() {
      return entries.length;
    },

    /** Recomputes the chain. Returns the first broken sequence number, or null. */
    verifyChain(candidate = entries) {
      let prev = GENESIS;
      for (const entry of candidate) {
        if (entry.prev_hash !== prev) return { ok: false, broken_at: entry.seq, reason: 'prev_hash' };
        const { hash, ...rest } = entry;
        if (hashEntry(rest) !== hash) return { ok: false, broken_at: entry.seq, reason: 'hash' };
        prev = entry.hash;
      }
      return { ok: true, broken_at: null };
    },
  };
}
