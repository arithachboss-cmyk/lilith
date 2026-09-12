# Lilith intelligence layer

## Current batch

Numeric matching and human-readable constraint reasons are deterministic. No LLM is called, no AI-generated summary is displayed, and no API key is required by the first vertical slice. UI workflow guidance is explicitly based on deal status.

The `AIRun` schema is present with actor, use case, model, prompt version, latency, success, usage, error code and timestamp. The provider service is **not yet implemented**.

## Required next implementation

Create server-only `src/services/ai/AIProvider` and `OpenAIProvider` with structured Zod-validated outputs for extractProperty, extractRequirement, normalizeProperty, normalizeRequirement, explainMatch, summarizeDeal and detectDuplicateCandidate.

Authorize referenced properties, requirements and rooms before gathering context. Apply request limits, timeouts and input truncation. Do not send client contact details by default. All attempts, including validation failures, provider refusal, timeout and unavailable configuration, must produce AIRun metadata without logging secrets or raw sensitive prompts.

Return explicit AI availability/error state while the deterministic workflow remains usable. AI prose must be labelled AI-generated. It must not alter deterministic numeric scores, grant verification, create offers, or change deal status.

Production portrait assets are absent. The current application uses typographic branding and labelled property-photo placeholders. No synthetic portrait or external image-generation integration is embedded.
