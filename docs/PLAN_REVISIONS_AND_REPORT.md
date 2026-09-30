# Plan: changes with Gemini in the loop, lasting memory, and a report before publishing (v1.1)

Branch: `feature/revise-and-report`. Not merged: `main` / `v1.0.0` stay as they are for the demo.

## 1. Asking for changes
After the AI produces a proposal (passed, blocked, rejected, approved or even deployed), a person types a change in Mission Control, for example "set the ransomware cover to ₹30L", "remove the fines cover", "make the BI waiting period 12 hours".
- Gemini changes only what was asked: clause updates (`add_coverage`), clause removal (`add_coverage.removeClauseIds`) or product-level values (`propose_product`).
- The changed proposal is a new version (iteration) and goes through all 23 rules again. If it is blocked, the named failures go back to Gemini, which repairs while keeping as much of the requested change as the rules allow.
- An earlier approval never covers a change: every new version needs a new sign-off, and only the newest version can be deployed.
- If Gemini cannot make the change (unreachable, or no tool calls), the previous version and status stay exactly as they were, and the UI says the change failed. A change never falls back to a canned proposal.

## 2. Memory that is never lost
- Every turn of the Gemini conversation (the request, each change request, the model's tool calls, our tool results, the gate's feedback) is stored verbatim in `pp_conversation_turn`: append-only, enforced by a database trigger, and it survives restarts.
- On every change Gemini receives the full stored history plus the current proposal as JSON, so even a change days later continues the same conversation from the truth.
- Mission Control gets a Conversation tab showing who said what (without raw JSON or thought signatures).

## 3. Pre-deployment report (required before publishing)
Deploy is refused (`report_required`) until a report exists for the approved version. The report is assembled from stored data only:
- the request, the product and its key values
- the verdict: counts per layer and every rule result
- every clause with its checks and citations (kind, issuer, document, official link, "matches the source")
- the version history: each version's cause (first proposal, requested change, repair), the instruction behind it and a before → after diff
- the reviewer's decision
- a PolicyCenter preview: the files, the term caps written into PolicyCenter (e.g. extortion max), the clauses PolicyCenter has no pattern for, and the deploy steps
- the integrity values: verdict, proposal and ruleset hashes

It is stored with its SHA-256 in `pp_report`; the deployment records the report id, and `pc.export` carries `reportSha256`.

## 4. Report UI (light theme)
A full-screen, light, document-style page inside Mission Control:
- a header with the product, version, status and hashes
- a summary card and the verdict by layer
- clause tables and a "before → after" list for each change
- citation cards with "Read the official document"
- a "What goes into PolicyCenter" section
- a **Publish to PolicyCenter** button that deploys and returns to the deploy tracker

## Status
| Part | State |
|---|---|
| DB migration V3 (memory, revisions, reports; append-only trigger) | done |
| Contracts `ConversationPort`, `RevisablePlannerPort` | done |
| Gemini planner: one conversation loop for the first run, repairs and changes; functionResponse turns; memory recorded; `revise()` | done (compiles; not yet run against live Gemini) |
| Backend: `POST/GET /executions/{id}/revisions`, `GET /executions/{id}/conversation`, `POST/GET /executions/{id}/report`; deploy guards (newest version, report required) | done |
| Tests: 5 new (change continues memory, memory append-only, passed change needs new approval + report, failed change restores state, fixture planner refuses changes); 67 backend tests pass | done |
| Events `revision.requested`, `revision.failed`, `report.generated` in docs/events.md and the web stream hook | to do |
| Mission Control: change box, suggestion chips, Conversation tab | to do (~2 h) |
| Report page, light theme, with Publish | to do (~2–3 h) |
| End-to-end test with live Gemini; VM check | to do |
| Update the explainer PDF and docs | to do |

## Risks
- Gemini availability (503s seen on the VM): retries and fallback models are on `main`; a failed change leaves everything as it was.
- Long conversations: the full history is sent every time. That is fine for Flash-class context windows; if it ever grows too large, summarise older turns into a stored "context" turn (never deleting the originals).
