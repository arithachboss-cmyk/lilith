-- 0001_extensions — the PostgreSQL extensions the data model relies on
-- (Blueprint §1.3, §8, ARCH-004).
--
--   postgis   geography columns and distance queries (§8.2.2, §8.2.3)
--   vector    pgvector embeddings for semantic assist (§8.2.3, §8.2.4)
--   pgcrypto  gen_random_uuid() for primary keys, and hashing helpers (§8)
--   pg_trgm   trigram similarity for search and duplicate detection (§10.3)
--   citext    case-insensitive email (§8.2.1)
--
-- Forward fix instead of a down migration: later migrations depend on these
-- types, so the extensions are never dropped once tables exist.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
