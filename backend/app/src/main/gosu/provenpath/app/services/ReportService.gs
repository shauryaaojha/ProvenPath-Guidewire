package provenpath.app.services

uses java.io.ByteArrayInputStream
uses java.nio.charset.StandardCharsets
uses java.time.Instant
uses java.util.ArrayList
uses java.util.LinkedHashMap
uses java.util.List
uses java.util.Map
uses java.util.zip.ZipInputStream
uses provenpath.app.ApiException
uses provenpath.app.db.Repository
uses provenpath.app.events.EventBus
uses provenpath.contracts.Json
uses provenpath.contracts.PackageBuilderPort
uses provenpath.contracts.Proposal
uses provenpath.core.engine.RuleLoader
uses provenpath.core.gate.Hashing

/**
 * The pre-deployment report: everything a person needs before a product is published to PolicyCenter, assembled
 * from stored data only (the verified proposal, every rule result, the cited source texts, the version history with
 * each requested change, the reviewer's decision, and a preview of exactly what will be written to PolicyCenter).
 * Stored with its SHA-256; a deploy requires a report for the approved version.
 */
class ReportService {

  static final var CLAUSE_FIELDS : List<String> = {"name", "existence", "limitMaxInr", "deductibleInr", "waitingHours", "conditions", "excludesPatternCodes", "factors"}
  static final var PRODUCT_FIELDS : List<String> = {"aggregateLimitInr", "turnoverInr", "minimumPremiumInr", "targetEffectiveDate", "proseSummary"}

  var _repo : Repository
  var _bus : EventBus
  var _builder : PackageBuilderPort
  var _loader : RuleLoader
  var _memory : ConversationStore

  construct(repo : Repository, bus : EventBus, builder : PackageBuilderPort, loader : RuleLoader, memory : ConversationStore) {
    _repo = repo
    _bus = bus
    _builder = builder
    _loader = loader
    _memory = memory
  }

  /** Builds, stores and announces a new report for the execution's latest (PASSED) version. */
  function generate(executionId : String) : Map<String, Object> {
    var report = build(executionId)
    var json = Json.canonical(report)
    var sha = Hashing.sha256Hex(json)
    var id = _repo.insertReport(executionId, report.get("runId") as String, json, sha)
    _bus.emit(executionId, "report.generated", VerifyService.map({"reportId" -> id, "runId" -> report.get("runId"),
        "iteration" -> report.get("iteration"), "reportSha256" -> sha}))
    return latest(executionId)
  }

  function latest(executionId : String) : Map<String, Object> {
    var row = _repo.latestReport(executionId)
    if (row == null) {
      throw new ApiException(404, "no_report", "no report has been generated for this execution yet")
    }
    var result = VerifyService.map({"reportId" -> row.get("id"), "runId" -> row.get("run_id"),
        "reportSha256" -> row.get("report_sha256"), "createdAt" -> row.get("created_at")})
    result.put("report", Json.MAPPER.readValue(row.get("report") as String, Map))
    return result
  }

  function build(executionId : String) : Map<String, Object> {
    var exec = _repo.execution(executionId)
    if (exec == null) {
      throw new ApiException(404, "unknown_execution", "execution not found: " + executionId)
    }
    var run = _repo.latestRun(executionId)
    if (run == null or run.get("status") != "PASSED") {
      throw new ApiException(409, "report_needs_passed_version",
          "the latest version has not passed the gate; a pre-deployment report is only made for a version that can ship")
    }
    var runId = run.get("id") as String
    var proposalRow = _repo.proposalRow(run.get("proposal_row_id") as String)
    var proposalMap = Json.MAPPER.readValue(proposalRow.get("proposal") as String, Map) as Map<String, Object>
    var proposal = Json.parse(proposalRow.get("proposal") as String, Proposal)
    var verdict = _repo.verdictForRun(runId)
    var nodes = _repo.nodesForRun(runId)

    var r = new LinkedHashMap<String, Object>()
    r.put("title", "Pre-deployment report")
    r.put("generatedAt", Instant.now().toString())
    r.put("executionId", executionId)
    r.put("product", VerifyService.map({"code" -> "SMCyber", "name" -> "SME Cyber Insurance", "line" -> "GLLine (GeneralLiabilityLine)",
        "coreSystem" -> "Guidewire PolicyCenter 10"}))
    r.put("request", exec.get("prompt"))
    r.put("executionStatus", exec.get("status"))
    r.put("runId", runId)
    r.put("iteration", run.get("iteration"))
    r.put("proposalId", proposal.ProposalId)
    r.put("productValues", VerifyService.map({"aggregateLimitInr" -> proposal.AggregateLimitInr, "turnoverInr" -> proposal.TurnoverInr,
        "minimumPremiumInr" -> proposal.MinimumPremiumInr, "targetEffectiveDate" -> proposal.TargetEffectiveDate?.toString(),
        "jurisdiction" -> proposal.Jurisdiction, "proseSummary" -> proposal.ProseSummary}))
    r.put("verdict", verdictSection(verdict.Status.name(), nodes, run))
    r.put("clauses", clauseSection(proposalMap, nodes))
    r.put("proposalChecks", nodes.where(\ n -> n.get("clause_id") == null).map(\ n -> check(n)))
    r.put("history", historySection(executionId))
    r.put("review", reviewSection(executionId, runId))
    r.put("policyCenter", policyCenterSection(proposal, verdict))
    r.put("memory", VerifyService.map({"turns" -> _memory.summary(executionId).size()}))
    r.put("integrity", VerifyService.map({"verdictHash" -> verdict.VerdictHash, "proposalHash" -> verdict.ProposalHash,
        "rulesetHash" -> verdict.RulesetHash, "gateTokenIssued" -> (verdict.GateToken != null)}))
    return r
  }

  // ─── sections ────────────────────────────────────────────────────────────────

  private function verdictSection(status : String, nodes : List<Map<String, Object>>, run : Map<String, Object>) : Map<String, Object> {
    var byLayer = new ArrayList<Map<String, Object>>()
    for (layer in {"TYPE", "RANGE", "CONSISTENCY", "RULE_MATCH", "SOURCE", "GROUNDING"}) {
      var ln = nodes.where(\ n -> n.get("layer") == layer)
      byLayer.add(VerifyService.map({"layer" -> layer, "checks" -> ln.size(),
          "rules" -> ln.map(\ n -> n.get("rule_code")).toSet().size(),
          "passed" -> ln.countWhere(\ n -> n.get("result") == "PASSED"),
          "failed" -> ln.countWhere(\ n -> n.get("result") == "FAILED"),
          "skipped" -> ln.countWhere(\ n -> n.get("result") == "SKIPPED"),
          "needsReview" -> ln.countWhere(\ n -> n.get("result") == "NEEDS_REVIEW")}))
    }
    return VerifyService.map({"status" -> status, "rules" -> _loader.Rules.size(), "checks" -> nodes.size(),
        "passed" -> nodes.countWhere(\ n -> n.get("result") == "PASSED"),
        "failed" -> nodes.countWhere(\ n -> n.get("result") == "FAILED"),
        "skipped" -> nodes.countWhere(\ n -> n.get("result") == "SKIPPED"),
        "needsReview" -> nodes.countWhere(\ n -> n.get("result") == "NEEDS_REVIEW"),
        "durationMs" -> run.get("duration_ms"), "byLayer" -> byLayer})
  }

  private function clauseSection(proposal : Map<String, Object>, nodes : List<Map<String, Object>>) : List<Map<String, Object>> {
    var out = new ArrayList<Map<String, Object>>()
    for (c in (proposal.get("clauses") as List<Map<String, Object>>) ?: new ArrayList<Map<String, Object>>()) {
      var id = c.get("clauseId") as String
      var entry = new LinkedHashMap<String, Object>(c)
      entry.put("checks", nodes.where(\ n -> n.get("clause_id") == id).map(\ n -> check(n)))
      var citations = new ArrayList<Map<String, Object>>()
      for (cit in (c.get("citations") as List<Map<String, Object>>) ?: new ArrayList<Map<String, Object>>()) {
        var src = _repo.source(cit.get("sourceCode") as String)
        var snippet = cit.get("textSnippet") as String
        citations.add(VerifyService.map({"sourceCode" -> cit.get("sourceCode"), "section" -> cit.get("section"), "textSnippet" -> snippet,
            "found" -> (src != null), "matchesSource" -> (src != null and snippet != null and (src.get("full_text") as String).contains(snippet)),
            "title" -> src?.get("title"), "kind" -> src?.get("kind"), "issuer" -> src?.get("issuer"),
            "document" -> src?.get("document"), "url" -> src?.get("url"), "effectiveDate" -> src?.get("effective_date")}))
      }
      entry.put("citations", citations)
      out.add(entry)
    }
    return out
  }

  private function check(n : Map<String, Object>) : Map<String, Object> {
    var rule = _loader.RulesByCode.get(n.get("rule_code") as String)
    return VerifyService.map({"ruleCode" -> n.get("rule_code"), "ruleName" -> rule?.Name, "layer" -> n.get("layer"),
        "result" -> n.get("result"), "expected" -> n.get("expected"), "actual" -> n.get("actual"), "sourceCode" -> n.get("source_code")})
  }

  /** Every version of the product: how it was verified, what changed, and which request caused the change. */
  private function historySection(executionId : String) : List<Map<String, Object>> {
    var rows = _repo.proposalRowsForExecution(executionId)
    var runs = _repo.runsForExecution(executionId)
    var revisions = _repo.revisions(executionId)
    var out = new ArrayList<Map<String, Object>>()
    var previous : Map<String, Object> = null
    for (row in rows) {
      var iteration = row.get("iteration") as int
      var p = Json.MAPPER.readValue(row.get("proposal") as String, Map) as Map<String, Object>
      var runForIt = runs.where(\ x -> (x.get("iteration") as int) == iteration).last()
      // A version right after a revision request is that request's change; any other later version is a repair.
      var revision = revisions.where(\ x -> x.get("status") != "failed" and (x.get("from_iteration") as int) == iteration - 1).last()
      var cause = previous == null ? "first proposal" : (revision != null ? "requested change" : "repair after the gate blocked")
      out.add(VerifyService.map({"iteration" -> iteration, "proposalId" -> row.get("proposal_id"), "createdAt" -> row.get("created_at"),
          "gate" -> runForIt?.get("status"), "failedChecks" -> runForIt?.get("nodes_failed"),
          "cause" -> cause, "instruction" -> revision?.get("instruction"),
          "changes" -> (previous == null ? new ArrayList<Object>() : diff(previous, p))}))
      previous = p
    }
    return out
  }

  private function reviewSection(executionId : String, runId : String) : Map<String, Object> {
    var reviews = _repo.reviewsForExecution(executionId).where(\ x -> x.get("run_id") == runId)
    if (reviews.Empty) {
      return VerifyService.map({"status" -> "pending", "note" -> "This version has not been signed by a Compliance Reviewer yet."})
    }
    var last = reviews.last()
    return VerifyService.map({"status" -> last.get("decision"), "reviewer" -> last.get("reviewer"),
        "reviewedAt" -> last.get("reviewed_at"), "comment" -> last.get("comment"), "reviewId" -> last.get("id")})
  }

  /** A dry run of the package builder: what the deploy would write, signed but never stored or queued. */
  private function policyCenterSection(proposal : Proposal, verdict : provenpath.contracts.Verdict) : Map<String, Object> {
    if (_builder == null) {
      return VerifyService.map({"available" -> false, "note" -> "The PolicyCenter package builder is not available on this backend."})
    }
    try {
      var pkg = _builder.build(proposal, verdict, "preview", "preview")
      var inside = unzipReport(pkg.ZipBytes)
      return VerifyService.map({"available" -> true, "preview" -> true, "productCode" -> pkg.Manifest.ProductCode,
          "files" -> pkg.Manifest.Files.map(\ f -> f.Path),
          "termRanges" -> pkg.Manifest.TermRanges.map(\ t -> VerifyService.map({"patternCode" -> t.PatternCode, "termCode" -> t.TermCode,
              "min" -> t.Min.toPlainString(), "max" -> t.Max.toPlainString(), "ruleCode" -> t.RuleCode})),
          "installedCoverages" -> inside?.get("installedCoverages"),
          "notInPolicyCenter" -> inside?.get("notInPolicyCenter"),
          "currencyNote" -> inside?.get("currency"),
          "steps" -> {"Package signed with the gate token and the approval", "Pulled and re-verified by the PC agent next to PolicyCenter",
              "Current files backed up, then written into modules/configuration", "PolicyCenter restarted (about 4 minutes for a values-only change)",
              "Product, coverages and capped terms confirmed through ProductModelAPI"}})
    } catch (e : Exception) {
      return VerifyService.map({"available" -> false, "note" -> "Could not preview the package: " + e.Message})
    }
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────

  /** Clause-level and product-level differences between two versions of a proposal. */
  static function diff(before : Map<String, Object>, after : Map<String, Object>) : List<Map<String, Object>> {
    var out = new ArrayList<Map<String, Object>>()
    for (f in PRODUCT_FIELDS) {
      if (!eq(before.get(f), after.get(f))) {
        out.add(VerifyService.map({"kind" -> "changed", "scope" -> "product", "field" -> f, "from" -> before.get(f), "to" -> after.get(f)}))
      }
    }
    var b = byId(before)
    var a = byId(after)
    for (e in a.entrySet()) {
      var old = b.get(e.Key)
      if (old == null) {
        out.add(VerifyService.map({"kind" -> "added", "scope" -> "clause", "clauseId" -> e.Key,
            "patternCode" -> e.Value.get("patternCode"), "name" -> e.Value.get("name")}))
        continue
      }
      for (f in CLAUSE_FIELDS) {
        if (!eq(old.get(f), e.Value.get(f))) {
          out.add(VerifyService.map({"kind" -> "changed", "scope" -> "clause", "clauseId" -> e.Key,
              "patternCode" -> e.Value.get("patternCode"), "name" -> e.Value.get("name"), "field" -> f,
              "from" -> old.get(f), "to" -> e.Value.get(f)}))
        }
      }
    }
    for (e in b.entrySet()) {
      if (!a.containsKey(e.Key)) {
        out.add(VerifyService.map({"kind" -> "removed", "scope" -> "clause", "clauseId" -> e.Key,
            "patternCode" -> e.Value.get("patternCode"), "name" -> e.Value.get("name")}))
      }
    }
    return out
  }

  private static function byId(p : Map<String, Object>) : Map<String, Map<String, Object>> {
    var m = new LinkedHashMap<String, Map<String, Object>>()
    for (c in (p.get("clauses") as List<Map<String, Object>>) ?: new ArrayList<Map<String, Object>>()) {
      m.put(c.get("clauseId") as String, c)
    }
    return m
  }

  private static function eq(x : Object, y : Object) : boolean {
    return Json.canonical(x) == Json.canonical(y)
  }

  private static function unzipReport(zip : byte[]) : Map<String, Object> {
    using (var zis = new ZipInputStream(new ByteArrayInputStream(zip))) {
      var e = zis.NextEntry
      while (e != null) {
        if (e.Name == "provenpath-report.json") {
          return Json.MAPPER.readValue(new String(zis.readAllBytes(), StandardCharsets.UTF_8), Map) as Map<String, Object>
        }
        e = zis.NextEntry
      }
    }
    return null
  }
}
