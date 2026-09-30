package provenpath.planner

uses java.io.File
uses java.math.BigDecimal
uses java.nio.charset.StandardCharsets
uses java.nio.file.Files
uses java.time.LocalDate
uses java.util.ArrayList
uses java.util.LinkedHashMap
uses java.util.List
uses java.util.Map
uses java.util.UUID
uses com.fasterxml.jackson.databind.ObjectMapper
uses provenpath.contracts.Citation
uses provenpath.contracts.Clause
uses provenpath.contracts.ClauseKind
uses provenpath.contracts.ConversationPort
uses provenpath.contracts.EventPort
uses provenpath.contracts.Json
uses provenpath.contracts.NodeStatus
uses provenpath.contracts.Proposal
uses provenpath.contracts.RegulatorySource
uses provenpath.contracts.RevisablePlannerPort
uses provenpath.contracts.Verdict
uses provenpath.contracts.VerdictStatus
uses provenpath.contracts.VerifyPort

/**
 * Track C: the live Gemini planner, loaded by class name when LLM_MODE=live (provenpath.planner.Planner).
 * Depends ONLY on :contracts.
 *
 * One conversation per execution, kept in a ConversationPort (the backend stores it append-only):
 *   1. The request, with every registered source in the system prompt.
 *   2. Gemini calls tools (propose_product, add_coverage); every call gets a functionResponse turn back.
 *   3. The proposal goes to the deterministic gate (VerifyPort). If BLOCKED, the named failures go back into the
 *      same conversation and Gemini repairs (at most MAX_REPAIR_ITERATIONS times).
 *   4. Later, a person can ask for changes (revise): Gemini continues the SAME conversation with the current
 *      proposal, and the revised proposal goes through the whole gate again.
 * The model only proposes; the verdict returned is always the verifier's, unchanged.
 */
class Planner implements RevisablePlannerPort {

  static final var MAPPER : ObjectMapper = new ObjectMapper()
  static final var MAX_REPAIR_ITERATIONS : int = 2

  var _apiKey : String
  var _gemini : GeminiClient
  var _sources : List<RegulatorySource>
  var _fixturesFallback : String

  /** No-arg constructor required: the backend loads this by Class.forName(...).getDeclaredConstructor({}).newInstance({}). */
  construct() {
    _apiKey = System.getenv("GEMINI_API_KEY") ?: ""
    var toolsDir = resolveDir("PROVENPATH_TOOLS_DIR", "shared/tools")
    var rulesDir = resolveDir("PROVENPATH_RULES_DIR", "rules")
    _fixturesFallback = resolveDir("PROVENPATH_FIXTURES_DIR", "fixtures")
    _gemini = new GeminiClient(_apiKey, toolsDir)
    _sources = loadSources(rulesDir)
  }

  override function run(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort) : Verdict {
    return runWithMemory(executionId, prompt, verifier, events, null)
  }

  override function runWithMemory(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort,
                                  memory : ConversationPort) : Verdict {
    if (_apiKey == null or _apiKey.trim().Empty) {
      events.emit(executionId, "planner.step", m({"step" -> 0, "action" -> "fallback",
          "note" -> "GEMINI_API_KEY not set — falling back to fixture", "mode" -> "live"}))
      return runFixtureFallback(executionId, prompt, verifier, events)
    }
    events.emit(executionId, "planner.step", m({"step" -> 1, "action" -> "plan",
        "note" -> "Building SMCyber product proposal via Gemini", "mode" -> "live"}))
    try {
      var convo = new Conversation(executionId, memory)
      convo.add("request", userText(buildUserPrompt(prompt)))
      return converse(executionId, buildSystemPrompt(ragLite(prompt)), convo, null, 1, verifier, events, false)
    } catch (e : Throwable) {
      events.emit(executionId, "planner.step", m({"step" -> 99, "action" -> "fallback",
          "note" -> "Gemini call failed (" + e.Message + ") — falling back to fixture", "mode" -> "live"}))
      return runFixtureFallback(executionId, prompt, verifier, events)
    }
  }

  override function revise(executionId : String, instruction : String, current : Proposal, nextIteration : int,
                           verifier : VerifyPort, events : EventPort, memory : ConversationPort) : Verdict {
    if (_apiKey == null or _apiKey.trim().Empty) {
      throw new IllegalStateException("Changes need the live Gemini planner, and GEMINI_API_KEY is not set")
    }
    var convo = new Conversation(executionId, memory)
    convo.loadStored()
    events.emit(executionId, "planner.step", m({"step" -> 1, "action" -> "revise", "mode" -> "live",
        "memoryTurns" -> convo.Size,
        "note" -> "Applying the requested change with Gemini, continuing the conversation (" + convo.Size + " earlier turns)"}))
    convo.add("revision", userText(buildRevisionRequest(instruction, current)))
    var working = Json.parse(Json.canonical(current), Proposal)
    working.Iteration = nextIteration
    return converse(executionId, buildSystemPrompt(ragLite(instruction)), convo, working, nextIteration, verifier, events, true)
  }

  // ─── The conversation loop (first run, repairs and revisions) ────────────────

  private function converse(executionId : String, systemPrompt : String, convo : Conversation, start : Proposal,
                            iteration : int, verifier : VerifyPort, events : EventPort, isRevision : boolean) : Verdict {
    var proposal = start
    var stepN = 2
    var response = _gemini.generateWithHistory(systemPrompt, convo.Contents)
    var calls = recordModelTurn(convo, response)
    if (calls.Empty) {
      var text = GeminiClient.extractText(response)
      if (isRevision) {
        throw new IllegalStateException("Gemini did not change the proposal: " + abbreviate(text, 300))
      }
    }
    proposal = processFunctionCalls(executionId, calls, proposal, events, convo, stepN, iteration)
    stepN += calls.size()

    events.emit(executionId, "planner.step", m({"step" -> stepN, "action" -> "verify_compliance",
        "note" -> "Submitting proposal to the deterministic gate", "mode" -> "live"}))
    if (proposal == null) {
      proposal = buildMinimalProposal(executionId, iteration)
    }
    var verdict = verifyProposal(executionId, proposal, verifier, events)
    recordGateResult(convo, verdict, proposal)

    var repairs = 0
    while (verdict.Status == VerdictStatus.BLOCKED and repairs < MAX_REPAIR_ITERATIONS) {
      repairs++
      var failures = collectFailures(verdict)
      // Contract (docs/events.md): runId, iteration, failedRule, clauseId, expected, actual, reason.
      // The full list rides along in "failures" for multi-rule repairs.
      var first = failures.isEmpty() ? m({}) : failures.get(0)
      events.emit(executionId, "planner.repair", m({
          "runId" -> verdict.RunId, "iteration" -> (proposal.Iteration + 1),
          "failedRule" -> first.get("ruleCode"), "clauseId" -> first.get("clauseId"),
          "expected" -> first.get("expected"), "actual" -> first.get("actual"), "reason" -> first.get("reason"),
          "failures" -> failures,
          "note" -> "Feeding " + failures.size() + " failure(s) back to Gemini for repair"}))

      response = _gemini.generateWithHistory(systemPrompt, convo.Contents)
      calls = recordModelTurn(convo, response)
      if (calls.Empty) {
        events.emit(executionId, "planner.step", m({"step" -> stepN + repairs * 10, "action" -> "repair_text",
            "note" -> "Gemini returned text instead of tool calls: " + abbreviate(GeminiClient.extractText(response), 200),
            "mode" -> "live"}))
        break
      }
      proposal.Iteration = proposal.Iteration + 1
      proposal = processFunctionCalls(executionId, calls, proposal, events, convo, stepN + repairs * 10, proposal.Iteration)
      verdict = verifyProposal(executionId, proposal, verifier, events)
      recordGateResult(convo, verdict, proposal)
    }
    return verdict
  }

  /** Records the model's content turn verbatim (thought signatures included) and returns its function calls. */
  private function recordModelTurn(convo : Conversation, response : Object) : List<Map<String, Object>> {
    var r = response as Map<String, Object>
    var candidates = r.get("candidates") as List<Object>
    if (candidates != null and !candidates.isEmpty()) {
      var content = (candidates.get(0) as Map<String, Object>).get("content") as Map<String, Object>
      if (content != null) {
        if (content.get("role") == null) content.put("role", "model")
        convo.add("model", content)
      }
    }
    return GeminiClient.extractFunctionCalls(response)
  }

  /** Tells the model what the gate decided, in the same conversation, so a later change starts from the truth. */
  private function recordGateResult(convo : Conversation, verdict : Verdict, p : Proposal) {
    if (verdict.Status == VerdictStatus.PASSED) {
      convo.add("gate_feedback", userText("The deterministic gate PASSED iteration " + p.Iteration +
          " (verdict hash " + verdict.VerdictHash + "). It now waits for a named Compliance Reviewer."))
    } else {
      convo.add("gate_feedback", userText(buildRepairRequest(collectFailures(verdict), verdict.RunId)))
    }
  }

  // ─── Tool call processing ────────────────────────────────────────────────────

  private function processFunctionCalls(executionId : String, calls : List<Map<String, Object>>, existing : Proposal,
                                        events : EventPort, convo : Conversation, stepOffset : int, iteration : int) : Proposal {
    var p = existing
    var stepN = stepOffset
    var responses = new ArrayList<Object>()

    for (fc in calls) {
      var name = fc.get("name") as String
      var args = (fc.get("args") ?: new LinkedHashMap<String, Object>()) as Map<String, Object>
      args.put("executionId", executionId)
      events.emit(executionId, "tool.called", m({"tool" -> name, "args" -> sanitizeArgs(args)}))

      var result : Map<String, Object>
      switch (name) {
        case "propose_product":
          // A re-propose during repair or revision keeps the iteration, the proposal id and the clauses so far.
          var prior = p
          p = buildProposalFromArgs(executionId, args, prior == null ? iteration : prior.Iteration)
          if (prior != null) {
            p.ProposalId = prior.ProposalId
            p.Clauses.addAll(prior.Clauses)
            if (p.ProseSummary.Empty) p.ProseSummary = prior.ProseSummary
          }
          result = m({"proposalId" -> p.ProposalId, "iteration" -> p.Iteration, "clauseCount" -> p.Clauses.size()})
          events.emit(executionId, "planner.step", m({"step" -> stepN, "action" -> name,
              "note" -> (prior == null ? "Proposal skeleton created" : "Product-level values updated"), "mode" -> "live"}))
          break
        case "add_coverage":
          if (p == null) p = buildMinimalProposal(executionId, iteration)
          var removed = 0
          var toRemove = args.get("removeClauseIds") as List<Object>
          if (toRemove != null) {
            for (id in toRemove) {
              var before = p.Clauses.size()
              p.Clauses.removeWhere(\ x -> x.ClauseId == String.valueOf(id))
              removed += before - p.Clauses.size()
            }
          }
          var clauses = parseClauses(args)
          for (c in clauses) {
            p.Clauses.removeWhere(\ x -> x.ClauseId == c.ClauseId)
            p.Clauses.add(c)
          }
          if (args.containsKey("proseSummary")) {
            p.ProseSummary = args.get("proseSummary") as String
          }
          result = m({"clauseCount" -> p.Clauses.size(), "addedOrReplaced" -> clauses.size(), "removed" -> removed})
          events.emit(executionId, "planner.step", m({"step" -> stepN, "action" -> name, "mode" -> "live",
              "note" -> "Added or replaced " + clauses.size() + " clause(s)" + (removed > 0 ? ", removed " + removed : "")}))
          break
        default:
          // verify_compliance runs after the tool calls, through the deterministic gate
          result = m({"note" -> "the deterministic gate verifies the proposal after these tool calls"})
          break
      }
      events.emit(executionId, "tool.result", m({"tool" -> name, "result" -> result}))
      responses.add(m({"functionResponse" -> m({"name" -> name, "response" -> result})}))
      stepN++
    }
    if (!responses.Empty) {
      convo.add("tool_results", m({"role" -> "user", "parts" -> responses}))
    }
    return p
  }

  // ─── Verification ────────────────────────────────────────────────────────────

  private function verifyProposal(executionId : String, p : Proposal, verifier : VerifyPort, events : EventPort) : Verdict {
    events.emit(executionId, "tool.called", m({"tool" -> "verify_compliance",
        "args" -> m({"proposalId" -> p.ProposalId, "iteration" -> p.Iteration})}))
    var verdict = verifier.verify(p)
    events.emit(executionId, "tool.result", m({"tool" -> "verify_compliance",
        "result" -> m({"runId" -> verdict.RunId, "status" -> verdict.Status.name(), "verdictHash" -> verdict.VerdictHash})}))
    return verdict
  }

  // ─── Failure extraction for repair prompt ────────────────────────────────────

  private function collectFailures(verdict : Verdict) : List<Map<String, Object>> {
    var failures = new ArrayList<Map<String, Object>>()
    for (n in verdict.Nodes) {
      if (n.Result == NodeStatus.FAILED or n.Result == NodeStatus.NEEDS_REVIEW) {
        failures.add(m({"ruleCode" -> n.RuleCode, "clauseId" -> n.ClauseId,
            "layer" -> n.Layer?.name(), "expected" -> n.Expected,
            "actual" -> n.Actual, "reason" -> n.Reason}))
      }
    }
    return failures
  }

  private function buildRepairRequest(failures : List<Map<String, Object>>, runId : String) : String {
    var sb = new java.lang.StringBuilder()
    sb.append("The compliance gate returned BLOCKED (runId=").append(runId).append("). ")
    sb.append("Failing rules:\n")
    for (f in failures) {
      sb.append("  - ").append(f.get("ruleCode")).append(": ").append(f.get("reason"))
      sb.append(" (expected=").append(f.get("expected")).append(", actual=").append(f.get("actual")).append(")\n")
    }
    sb.append("\nPlease repair the proposal by calling add_coverage with corrected clause values. ")
    sb.append("If a person asked for a change, keep as much of it as the rules allow. ")
    sb.append("All citations must be VERBATIM from the sources. Remember:\n")
    sb.append("  - CYB-RNG-002: extortion sublimit must be <= 50% of aggregateLimitInr\n")
    sb.append("  - CYB-CON-001: sum of first-party limits must not exceed aggregate\n")
    sb.append("  - Citations must be byte-exact copies from the sources' full_text\n")
    return sb.toString()
  }

  /** The change request, with the current proposal attached so the model never works from a stale memory. */
  private function buildRevisionRequest(instruction : String, current : Proposal) : String {
    return "CHANGE REQUEST from the product manager (a person): \"" + instruction.trim() + "\"\n\n" +
        "The current proposal is iteration " + current.Iteration + " and is shown below as JSON. Apply ONLY this change:\n" +
        "- add_coverage adds or replaces clauses; a replaced clause keeps its clauseId and must include all its fields and citations.\n" +
        "- add_coverage with removeClauseIds removes clauses.\n" +
        "- propose_product changes product-level values (aggregateLimitInr, turnoverInr, minimumPremiumInr, targetEffectiveDate); existing clauses are kept.\n" +
        "Do not change anything that was not asked for. Update proseSummary if any number in it changes. " +
        "If the change would break a rule, make it anyway; the deterministic gate will name the failure and you will get a chance to repair.\n\n" +
        "CURRENT PROPOSAL:\n" + Json.canonical(current)
  }

  private static function userText(text : String) : Map<String, Object> {
    return m({"role" -> "user", "parts" -> list(m({"text" -> text}))})
  }

  private static function abbreviate(s : String, max : int) : String {
    if (s == null) return ""
    return s.length() <= max ? s : s.substring(0, max) + "…"
  }

  /**
   * The conversation sent to Gemini: the stored turns (from memory) plus this call's new turns. Every new turn is
   * written to memory as it happens. Consecutive turns of the same role are merged when sent, as the API expects.
   */
  static class Conversation {
    var _executionId : String
    var _memory : ConversationPort
    var _turns : List<Map<String, Object>> = new ArrayList<Map<String, Object>>()

    construct(executionId : String, memory : ConversationPort) {
      _executionId = executionId
      _memory = memory
    }

    function loadStored() {
      if (_memory != null) _turns.addAll(_memory.load(_executionId))
    }

    function add(kind : String, turn : Map<String, Object>) {
      _turns.add(turn)
      _memory?.append(_executionId, kind, turn)
    }

    property get Size() : int { return _turns.size() }

    property get Contents() : List<Map<String, Object>> {
      var merged = new ArrayList<Map<String, Object>>()
      for (t in _turns) {
        var role = (t.get("role") as String) ?: "user"
        var parts = (t.get("parts") as List<Object>) ?: new ArrayList<Object>()
        if (!merged.Empty and merged.last().get("role") == role) {
          (merged.last().get("parts") as List<Object>).addAll(parts)
        } else {
          var copy = new LinkedHashMap<String, Object>(t)
          copy.put("role", role)
          copy.put("parts", new ArrayList<Object>(parts))
          merged.add(copy)
        }
      }
      return merged
    }
  }

  // ─── Prompt builders ─────────────────────────────────────────────────────────

  private function buildSystemPrompt(ragContext : String) : String {
    return "You are a compliance-aware insurance product configurator for ProvenPath, a Guidewire PolicyCenter integration.\n" +
        "You PROPOSE product configurations for Indian SME Cyber Insurance (SMCyber). The deterministic ProvenPath gate DECIDES compliance.\n" +
        "You must NEVER claim compliance or inject {\"compliant\": true} — the gate does that.\n\n" +
        "CRITICAL RULES:\n" +
        "1. Call propose_product FIRST with aggregateLimitInr, turnoverInr, minimumPremiumInr, targetEffectiveDate.\n" +
        "2. Call add_coverage with ALL required coverages and exclusions.\n" +
        "3. owningEntityType MUST be \"GeneralLiabilityLine\" on every clause.\n" +
        "4. patternCode MUST match ^SMCyber[A-Za-z]+(Cov|Excl)$.\n" +
        "5. Citations textSnippet MUST be VERBATIM from the regulatory sources below.\n" +
        "6. Required coverages: SMCyberDataBreachCov, SMCyberPrivacyLiabilityCov.\n" +
        "7. Required exclusions: SMCyberWarExcl, SMCyberPriorKnownExcl, SMCyberIntentionalActsExcl, SMCyberInfraFailureExcl.\n" +
        "8. Extortion coverage (SMCyberExtortionCov) limitMaxInr MUST be <= aggregateLimitInr * 0.5.\n" +
        "9. minimumPremiumInr MUST be >= 10000.\n" +
        "9b. turnoverInr MUST be <= 5000000000 (MSME medium-enterprise limit, S.O. 1364(E) 2025).\n" +
        "9c. Cite official sources (IRDAI-CYBER-2021-*, CERT-IN-*) for coverages and exclusions. A citation textSnippet must be an exact substring of one full_text below, and the source must be in force on targetEffectiveDate.\n" +
        "10. All monetary values in INR integers.\n\n" +
        "REGULATORY SOURCES (cite these VERBATIM):\n" + ragContext
  }

  private function buildUserPrompt(prompt : String) : String {
    return "Please create an SMCyber insurance product configuration for the following request:\n\n" +
        prompt + "\n\n" +
        "Start with propose_product, then add all coverages and exclusions with add_coverage. " +
        "Use targetEffectiveDate of " + LocalDate.now().plusMonths(1).toString() + ". " +
        "Include all mandatory coverages and exclusions. Extortion sublimit must be at most 50% of the aggregate limit. " +
        "Every clause needs at least one citation with text copied VERBATIM from the sources in the system prompt."
  }

  // ─── RAG-lite ────────────────────────────────────────────────────────────────

  private function ragLite(prompt : String) : String {
    if (_sources.isEmpty()) return "(no sources loaded)"
    var keywords = extractKeywords(prompt)
    var relevant = new ArrayList<RegulatorySource>()
    for (src in _sources) {
      var text = (src.Title ?: "") + " " + (src.FullText ?: "")
      for (kw in keywords) {
        if (text.toLowerCase().contains(kw.toLowerCase())) {
          if (!relevant.contains(src)) {
            relevant.add(src)
          }
          break
        }
      }
    }
    // Always include the CERT-In source
    for (src in _sources) {
      if (src.SourceCode != null and src.SourceCode.startsWith("CERT-IN") and !relevant.contains(src)) {
        relevant.add(src)
      }
    }
    // The whole registry is small (~27 sources, ~9 KB) and the model can only quote verbatim what it is shown,
    // so the keyword hits come first and every other source follows.
    for (src in _sources) {
      if (!relevant.contains(src)) relevant.add(src)
    }

    var sb = new java.lang.StringBuilder()
    for (src in relevant) {
      sb.append("source_code: ").append(src.SourceCode).append("\n")
      sb.append("section: ").append(src.Section).append("\n")
      sb.append("title: ").append(src.Title).append("\n")
      sb.append("full_text: ").append(src.FullText).append("\n\n")
    }
    return sb.toString()
  }

  private function extractKeywords(prompt : String) : List<String> {
    var keywords = new ArrayList<String>()
    var lower = prompt.toLowerCase()
    // Cyber coverage keywords
    for (kw in {"extortion", "ransomware", "data breach", "privacy", "business interruption",
        "regulatory", "fines", "deductible", "aggregate", "cyber", "startup", "sme"}) {
      if (lower.contains(kw)) keywords.add(kw)
    }
    // Always include range and mandatory keywords
    keywords.add("mandatory")
    keywords.add("aggregate")
    return keywords
  }

  // ─── Proposal builders from LLM args ─────────────────────────────────────────

  private function buildProposalFromArgs(executionId : String, args : Map<String, Object>, iteration : int) : Proposal {
    var p = new Proposal()
    p.ExecutionId = executionId
    p.ProposalId = "PP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
    p.Iteration = iteration
    p.Line = "SMCyber"
    p.Jurisdiction = "IN"
    p.AggregateLimitInr = toLong(args.get("aggregateLimitInr"), 5000000L)
    p.TurnoverInr = toLong(args.get("turnoverInr"), 200000000L)
    p.MinimumPremiumInr = toLong(args.get("minimumPremiumInr"), 25000L)
    var dateStr = args.get("targetEffectiveDate") as String
    p.TargetEffectiveDate = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now().plusMonths(1)
    p.ProseSummary = (args.get("proseSummary") as String) ?: ""
    p.Clauses = new ArrayList<Clause>()
    return p
  }

  private function buildMinimalProposal(executionId : String, iteration : int) : Proposal {
    var p = new Proposal()
    p.ExecutionId = executionId
    p.ProposalId = "PP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
    p.Iteration = iteration
    p.Line = "SMCyber"
    p.Jurisdiction = "IN"
    p.AggregateLimitInr = 5000000L
    p.TurnoverInr = 200000000L
    p.MinimumPremiumInr = 25000L
    p.TargetEffectiveDate = LocalDate.now().plusMonths(1)
    p.ProseSummary = ""
    p.Clauses = new ArrayList<Clause>()
    return p
  }

  private function parseClauses(args : Map<String, Object>) : List<Clause> {
    var result = new ArrayList<Clause>()
    if (args.get("clause") != null) {
      result.add(parseClause(args.get("clause")))
    }
    if (args.get("clauses") != null) {
      for (c in args.get("clauses") as List<Object>) {
        result.add(parseClause(c))
      }
    }
    return result
  }

  private function parseClause(obj : Object) : Clause {
    if (obj typeis Clause) return obj
    return Json.MAPPER.convertValue(obj, Clause)
  }

  // ─── Fixture fallback ─────────────────────────────────────────────────────────

  private function runFixtureFallback(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort) : Verdict {
    var fp = new FixtureFallback(_fixturesFallback)
    return fp.run(executionId, prompt, verifier, events)
  }

  // ─── Source loading ───────────────────────────────────────────────────────────

  private static function loadSources(rulesDir : String) : List<RegulatorySource> {
    var result : List<RegulatorySource> = new ArrayList<RegulatorySource>()
    try {
      var f = new File(rulesDir, "sources.yaml")
      if (!f.exists()) {
        f = new File(rulesDir + "/rules", "sources.yaml")
      }
      if (!f.exists()) return result
      var yaml = new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8)
      // Parse using the existing RegulatorySource structure via SnakeYAML (available in :core, not :planner)
      // Fall back to simple text extraction
      result = parseSourcesYaml(yaml)
    } catch (e : Throwable) {
      // If parsing fails, return empty — the prompt will still work without RAG context
    }
    return result
  }

  private static function parseSourcesYaml(yaml : String) : List<RegulatorySource> {
    var result = new ArrayList<RegulatorySource>()
    // Simple line-by-line parser for the sources.yaml format (no SnakeYAML dependency in :planner)
    var current : RegulatorySource = null
    for (rawLine in yaml.split("\n")) {
      var line = rawLine.trim()
      if (line.startsWith("- source_code:")) {
        if (current != null) result.add(current)
        current = new RegulatorySource()
        current.SourceCode = extractValue(line, "- source_code:")
      } else if (line.startsWith("source_code:") and current == null) {
        current = new RegulatorySource()
        current.SourceCode = extractValue(line, "source_code:")
      } else if (line.startsWith("title:") and current != null) {
        current.Title = extractValue(line, "title:")
      } else if (line.startsWith("section:") and current != null) {
        current.Section = extractValue(line, "section:")
      } else if (line.startsWith("full_text:") and current != null) {
        current.FullText = extractQuotedValue(line, "full_text:")
      } else if (line.startsWith("jurisdiction:") and current != null) {
        current.Jurisdiction = extractValue(line, "jurisdiction:")
      }
    }
    if (current != null) result.add(current)
    return result
  }

  private static function extractValue(line : String, prefix : String) : String {
    var val = line.substring(prefix.length()).trim()
    if (val.startsWith("\"") and val.endsWith("\"")) {
      val = val.substring(1, val.length() - 1)
    }
    return val
  }

  private static function extractQuotedValue(line : String, prefix : String) : String {
    var rest = line.substring(prefix.length()).trim()
    if (rest.startsWith("\"")) {
      // Strip surrounding quotes
      if (rest.endsWith("\"") and rest.length() > 1) {
        rest = rest.substring(1, rest.length() - 1)
      } else {
        rest = rest.substring(1)
      }
    }
    return rest
  }

  // ─── Utilities ────────────────────────────────────────────────────────────────

  private static function toLong(val : Object, defaultVal : long) : long {
    if (val == null) return defaultVal
    if (val typeis Number) return (val as Number).longValue()
    try { return Long.parseLong(val.toString()) } catch (e) { return defaultVal }
  }

  private static function sanitizeArgs(args : Map<String, Object>) : Map<String, Object> {
    // Don't log the full clause list in events — keep it readable
    var safe = new LinkedHashMap<String, Object>(args)
    safe.remove("executionId")
    return safe
  }

  private static function m(kv : Map<String, Object>) : Map<String, Object> {
    return new LinkedHashMap<String, Object>(kv)
  }

  private static function list(item : Object) : List<Object> {
    var l = new ArrayList<Object>()
    l.add(item)
    return l
  }

  private static function resolveDir(envName : String, name : String) : String {
    var fromEnv = System.getenv(envName)
    if (fromEnv != null and !fromEnv.trim().Empty) return fromEnv.trim()
    for (candidate in {"../" + name, name, "../../" + name, "../../../" + name}) {
      var f = new File(candidate)
      if (f.Directory) return f.CanonicalPath
    }
    return new File(name).AbsolutePath
  }
}
