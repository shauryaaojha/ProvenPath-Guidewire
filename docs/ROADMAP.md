# ProvenPath roadmap: from one cyber product to universal

**The goal:** any AI-generated insurance configuration, for any product line, in any jurisdiction, on any core system, from any AI model, passes through one deterministic, evidence-backed gate and a named human before it goes live.

| Version | Scope | In one line |
|---|---|---|
| **v1.0** (done, tag `v1.0.0`) | 1 product · India · Guidewire PolicyCenter 10 · Gemini | SME Cyber, end to end, on the real PolicyCenter |
| **v2** | Every P&C line · India · PolicyCenter | A product registry: new lines are data, not code |
| **v3** | Any jurisdiction · any core system · any model · the whole product lifecycle | ProvenPath Universal |

## What never changes (the invariants)
These hold in v1 and must hold in every later version. A feature that breaks one does not ship.
1. **The AI proposes, code decides.** No model output is ever a verdict. The gate is deterministic: same input, same rules, same hash.
2. **Nothing ships without a named human** who saw the verdict and the provenance.
3. **Every rule cites a source.** Official text is quoted verbatim and byte-checked; anything the insurer decides itself is labelled as the insurer's own.
4. **Unknown means no.** A clause no rule covers is NEEDS_REVIEW, which blocks.
5. **False passes stay at zero** on every eval corpus, per product and per jurisdiction. False blocks are reported, never hidden.
6. **Everything is evidence.** Every decision is an append-only, hashed, replayable event; every deploy is signed and re-verified next to the core system.

## Where v1 stands (29 Sep 2026)
- **Running on the Guidewire VM:** backend, Mission Control, PC agent; SMCyber confirmed through ProductModelAPI.
- **Tests and eval:** 62 backend tests; eval 0/20 false passes, 0/20 false blocks.
- **Gemini:** a live run on the VM hit a Gemini 503 ("high demand"). The planner fell back to the fixture, as designed.
- **Still to prove:** the first agent deploy into the real PolicyCenter, and PolicyCenter refusing an over-cap value on screen.

---

## v2: every product line (India, PolicyCenter)

### What changes
Today, the SMCyber specifics are hard-coded in four places:
- the rule pack,
- the planner prompt,
- the package builder's term table,
- the PolicyCenter template.

v2 moves all of them into a **product registry**, so adding a line means adding data and tests, not code.

```
products/<code>/
  product.yaml      code, name, jurisdiction, PolicyCenter line pattern + owning entity,
                    coverage patterns, cov-term <-> rule mapping (for PolicyCenter term limits)
  rules/*.yaml      the rule pack (same DSL as v1)
  sources.yaml      verbatim official texts + labelled internal documents
  overlay/          PolicyCenter product-model template
  fixtures/         demo proposals
  eval/             labelled corpus (compliant / non-compliant with expected failing rule)
```

### Workstreams
| # | Workstream | What it delivers | Owner (track) |
|---|---|---|---|
| P1 | **Product registry + per-product gate** | Gate loads the pack for the proposal's product; ruleset hash per pack; `/api/v1/products`, `/rules?product=` | Shaurya (A) |
| P2 | **Rule DSL v2** | Fewer hard-coded Gosu functions: table lookups, cross-clause sums and counts, "required coverage/exclusion sets" as data, effective-dated values. New rules become YAML, not code | Shaurya (A) |
| P3 | **Source library + ingestion pipeline** | `tools/sources/`: download the official PDF, record its URL and SHA-256, extract passages verbatim, re-check on demand; a Sources page in Mission Control | Dhriti (C) |
| P4 | **Planner, product-aware** | System prompt, allowed pattern codes and tool schemas generated from `product.yaml`; the product picked by the user or inferred; retries and a second model before falling back | Dhriti (C) |
| P5 | **Generic package builder + multi-line PolicyCenter** | Term-range table and template from `product.yaml`; the agent already confirms whatever the manifest lists | Chinmay (B) |
| P6 | **Mission Control for many products** | Product picker in the composer, product in every view, per-product metrics, a rules and sources browser | Shaurya (A) |
| P7 | **Reviewer accounts and approval tiers** | Login, roles (proposer, reviewer, admin), two-person approval above a limit threshold, rejection reasons in reports | Shaurya (A) |
| P8 | **Evidence bundle** | One click per deployment: a PDF/zip with the proposal, verdict, every rule result, cited texts, reviewer, manifest and PolicyCenter confirmation, ready for an auditor or a regulator's use-and-file record | Chinmay (B) |

### New product lines (each with a real legal basis and a PolicyCenter base line)
| Order | Product | Real basis in India | PolicyCenter line |
|---|---|---|---|
| 1 | **Public Liability (Industrial)** | Public Liability Insurance Act, 1991: compulsory cover for owners handling hazardous substances | General Liability (same line as SMCyber: proves the registry with the least new PolicyCenter work) |
| 2 | **Fire for micro and small enterprises** | IRDAI standard products *Bharat Sookshma Udyam Suraksha* and *Bharat Laghu Udyam Suraksha* (from 1 Apr 2021) | Commercial Property |
| 3 | **Employees' Compensation** | Employees' Compensation Act, 1923 | Workers' Compensation |
| 4 | **Motor third party (fleets)** | Motor Vehicles Act, 1988, s.146–147 (compulsory third-party cover) | Commercial Auto |
| 5 | **Surety bonds** | IRDAI (Surety Insurance Contracts) Guidelines, 2022 | Inland Marine or a new line |
| later | Group health | IRDAI standard product *Arogya Sanjeevani* | outside PolicyCenter's P&C scope |

The recipe for each line follows v1:
- Verbatim official sources, with numeric caps no regulator sets kept in a labelled underwriting guideline.
- A golden package test, and an eval corpus with a false-pass target of zero.
- One PolicyCenter install. The first install of new pattern files compiles for about 22 minutes on the VM; later value changes restart in about 4 minutes.

### v2 milestones and exit criteria
| Milestone | Done when |
|---|---|
| **M1: Registry** | SMCyber moved into `products/smcyber/` with no behaviour change; all v1 tests and the eval still pass; the ruleset hash is per product |
| **M2: Second product** | Public Liability proposed by Gemini, blocked, repaired, approved and deployed into PolicyCenter; its eval is at 0 false passes |
| **M3: Three lines** | Fire and Employees' Compensation added; the product picker is live; Rule DSL v2 covers them with no new Gosu functions |
| **M4: Enterprise basics** | Reviewer login and approval tiers; evidence bundle per deployment; source library with re-check |
| **v2.0 release** | Five lines, each with eval, golden tests, real sources and one confirmed PolicyCenter deploy |

---

## v3: ProvenPath Universal
v3 makes each outer part pluggable, keeping the invariant core (gate, hashing, signing, review, event log) unchanged.

```
             any AI model ─┐                         ┌─ Guidewire PolicyCenter (on-prem, Cloud API)
     any agent via MCP ────┼─► PLANNER ADAPTERS ─► ┌───────────────┐ ─► CORE-SYSTEM ADAPTERS ─┼─ Duck Creek, Sapiens, Majesco, EIS
                           │                       │ INVARIANT CORE │                          └─ file / API export for anything else
                           │                       │ gate · hashes  │
   jurisdiction packs ─────┴─► RULE & SOURCE PACKS │ review · log   │ ─► EVIDENCE & FILING PACKS ─► regulator, auditor
   (India, EU, UK, US, …)                          └───────────────┘
```

### 1. Any jurisdiction
The rule and source packs become **jurisdiction × product**: `packs/<jurisdiction>/<product>/`. Each jurisdiction adds its real legal texts, for example:
- **EU:** Insurance Distribution Directive (EU) 2016/97, Art. 25, product oversight and governance; GDPR Art. 33, 72-hour breach notification.
- **UK:** FCA Handbook, PROD sourcebook (product governance).
- **US:** state rate and form filing (NAIC model laws, filings through SERFF), state breach-notification laws.
- **More:** Singapore (MAS), UAE and others, on demand.

A product sold in several countries composes packs: the product rules plus each jurisdiction's rules. The strictest applicable rule wins, and the verdict names which jurisdiction failed.

### 2. Any core system
`PackageBuilderPort` and the agent become an **adapter interface** per core system:
- **Guidewire PolicyCenter:** the v1 overlay and agent, plus Guidewire Cloud (Cloud API) for cloud tenants.
- **Other core systems:** Duck Creek, Sapiens, Majesco, EIS, each through its own product-configuration format or API.
- **Everything else:** a neutral export (the signed manifest plus the product as JSON).

Every adapter must pass the same conformance suite: the signature and hash checks, tamper refusal, idempotent re-deploy, rollback, and confirmation read back from the target system.

### 3. Any AI model
- **Planner adapters:** Gemini (v1), Claude, GPT and self-hosted open models behind one `PlannerPort`, configured per tenant. Model choice never affects the verdict, because only the gate decides.
- **Any agent:** the MCP endpoint lets external agents use the gate as a tool.
- **Planner arbitration:** optionally ask two models and present both passed proposals to the reviewer, with a diff.

### 4. The whole product lifecycle, not just configuration
| Stage | What the gate checks |
|---|---|
| **Rating** | Rate books and factors within actuarial and filed bounds; no prohibited rating factors |
| **Underwriting rules** | Referral and decline rules consistent with the product and the law |
| **Policy wording** | Generated wording grounded in the verified product: every number and promise matches a verified clause (extends the v1 grounding layer) |
| **Regulatory filing** | A filing pack per regulator (for India, IRDAI use-and-file), generated from the verified product and its evidence |
| **Product changes** | Endorsements and version changes shown as a diff, re-verified, re-approved, deployed with rollback |
| **Retirement** | A product withdrawn cleanly from the core system when its basis changes |

### 5. Continuous compliance
- **Source watcher:** monitors the official publishers in each pack. When a circular or notification changes, the affected sources are re-extracted, rules and products that cite them are flagged, and **every live product is re-verified automatically**.
- **Compliance dashboard:** which live products pass today's rules, which are affected by a new regulation, and what needs a reviewer.
- **Red-team corpus:** adversarial proposals (paraphrased citations, unit tricks, lakh/crore confusion, injected "compliant: true") run nightly against every pack.

### 6. Rules as governed code
- **Rule studio:** compliance teams write and test rules without code; a new rule needs its source, positive and negative test cases, and a second reviewer.
- **AI-drafted rules, human-approved:** a model may draft a rule from a regulation, but it goes through the same gate idea: tests plus a named approver before it is active.
- **Versioned, signed rule packs:** every verdict records the exact pack version, so any past decision can be replayed.

### 7. Enterprise platform
- **Deployment and tenancy:** multi-tenant SaaS and on-prem; SSO (SAML/OIDC) and role-based access.
- **Keys:** signing keys in a KMS or HSM, never in `.env`.
- **Data and audit:** data residency per jurisdiction; audit export and retention policies; SOC 2 / ISO 27001-style controls.
- **Operations:** high availability for the gate, rate limits and observability (OpenTelemetry).

### v3 milestones
| Milestone | Done when |
|---|---|
| **U1: Second jurisdiction** | One product (cyber) with an EU or UK pack composed with its product rules; a cross-jurisdiction verdict names the failing jurisdiction |
| **U2: Second core system** | A second adapter passes the conformance suite and deploys a verified product end to end |
| **U3: Model-agnostic** | Two planner models behind `PlannerPort`; the same proposal gets the same verdict regardless of model |
| **U4: Lifecycle** | Rating and wording checks live for one product; a filing pack generated for one regulator |
| **U5: Continuous compliance** | The source watcher detects a real change and triggers re-verification of affected live products |
| **v3.0 release** | Two or more jurisdictions, two or more core systems, two or more models, rating and wording gated, source watcher live, with an enterprise deployment option |

---

## Risks and how we handle them
| Risk | Mitigation |
|---|---|
| Regulations are not machine-readable and change often | Verbatim extraction plus a source watcher; rules cite exact passages and effective dates; humans approve rule changes |
| Rule packs grow into unmaintainable code | Rule DSL v2 keeps rules as data; each rule carries its tests and source |
| Core-system integration is slow (PolicyCenter's first-install compile) | Pre-install pattern sets; value-only deploys; adapters with rollback |
| LLM availability (e.g. the Gemini 503 seen on the VM) | Retries, a second model, and a clearly labelled fallback; the gate never depends on the model |
| Numeric caps mistaken for regulation | Every source has a kind; internal guidelines are labelled in the UI and the evidence bundle |
| Over-trust in the tool | Human sign-off is mandatory; the output is compliance evidence, not legal advice |

## Order of work
1. Close v1: the first real agent deploy on the VM; retries and a second model for Gemini.
2. v2 M1 → M4, then the v2.0 release.
3. v3 U1 (a second jurisdiction) and U3 (model-agnostic) first: they are mostly data and ports. Then U2 (a second core system), U4 (lifecycle) and U5 (continuous compliance).
