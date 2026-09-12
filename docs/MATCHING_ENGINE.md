# Deterministic matching v1

Entry point: `src/domain/matching/engine.ts`. Input contracts: `src/domain/matching/types.ts`.

The output contains `score`, `confidence`, `hardConstraintPassed`, `matchedConstraints`, `tradeoffs`, `unmatchedConstraints`, `reasons`, and `engineVersion`.

Default weights: budget 40, location 30, bedrooms 20, facilities 10. Set `MATCH_WEIGHTS_JSON` to a complete validated weight object to configure new matches. Values must be finite and nonnegative with a positive total. Existing pair snapshots are not silently recomputed when policy changes.

Budget compares exact minor units; a price one satang over a hard budget fails. Districts match after trimming, lowercasing and collapsing whitespace. Facilities score the fraction of unique requested facilities present. No requested facilities means full facility score and lower evidence completeness.

Transaction type, property type and currency must match. Budget and district restrictions follow the requirement's hard flags. Failed hard constraints receive score zero and are excluded from Discover. Passing weighted dimension values are divided by total weight, scaled to 100 and rounded to an integer.

`confidence` means preference evidence completeness (1 with facility preferences, 0.75 without). It is not deal-close probability or a claim of empirical model calibration.

Generation is explicit POST, owner-scoped, paginated in batches of eight. Duplicate pairs preserve the original match ID, score and consent history. Discover shows undecided passing matches; Match Inbox includes passed and nonpassing candidates with explanations. A nonpassing candidate cannot express interest.

Tests cover perfect match, budget mismatch, wrong transaction, location mismatch, partial facilities, hard failures, configurable weights, normalization, determinism and exact monetary boundaries. Numeric scoring never calls an LLM.
