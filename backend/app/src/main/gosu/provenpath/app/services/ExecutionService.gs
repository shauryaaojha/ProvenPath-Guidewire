package provenpath.app.services

uses java.util.List
uses java.util.Map
uses java.util.UUID
uses java.util.concurrent.ExecutorService
uses provenpath.app.ApiException
uses provenpath.app.db.Repository
uses provenpath.app.events.EventBus
uses provenpath.contracts.Json
uses provenpath.contracts.PlannerPort
uses provenpath.contracts.Proposal
uses provenpath.contracts.RevisablePlannerPort
uses provenpath.contracts.Verdict
uses provenpath.contracts.VerdictStatus

/**
 * Execution lifecycle:
 *   planning → verified_fail                       (still BLOCKED after the planner's repairs)
 *   planning → review_pending → approved | rejected (PASSED → named Compliance Reviewer decides)
 *   approved → deploying → deployed | deploy_failed (deploy_failed may be redeployed)
 *   review_pending | approved | rejected | verified_fail | deploy_failed | deployed → planning (a person asks for changes)
 *   any → error                                     (planner crashed; the error is in the event log)
 */
class ExecutionService {

  var _repo : Repository
  var _bus : EventBus
  var _verify : VerifyService
  var _planner : PlannerPort
  var _plannerError : String
  var _mode : String
  var _executor : ExecutorService
  var _memory : ConversationStore

  construct(repo : Repository, bus : EventBus, verify : VerifyService, planner : PlannerPort, plannerError : String,
            mode : String, executor : ExecutorService) {
    _repo = repo
    _bus = bus
    _verify = verify
    _planner = planner
    _plannerError = plannerError
    _mode = mode
    _executor = executor
    _memory = new ConversationStore(repo)
  }

  /** Creates the execution and starts the planner in the background. Returns the execution id immediately. */
  function start(prompt : String) : String {
    var id = create(prompt, _mode)
    if (_executor == null) {
      runPlanner(id, prompt)
    } else {
      _executor.execute(\ -> runPlanner(id, prompt))
    }
    return id
  }

  /** Creates an execution without running the planner (used by the MCP tools). */
  function create(prompt : String, mode : String) : String {
    if (prompt == null or prompt.trim().Empty) {
      throw new ApiException(400, "prompt_required", "prompt is required")
    }
    var id = "exec-" + UUID.randomUUID().toString()
    _repo.insertExecution(id, prompt.trim(), mode)
    _bus.emit(id, "run.started", VerifyService.map({"prompt" -> prompt.trim(), "mode" -> mode}))
    return id
  }

  function runPlanner(id : String, prompt : String) {
    try {
      if (_planner == null) {
        throw new IllegalStateException("No planner available: " + _plannerError)
      }
      var verdict = _planner typeis RevisablePlannerPort
          ? (_planner as RevisablePlannerPort).runWithMemory(id, prompt.trim(), _verify, _bus, _memory)
          : _planner.run(id, prompt.trim(), _verify, _bus)
      afterVerification(id, verdict)
    } catch (e : Throwable) {
      _repo.setExecutionStatus(id, "error")
      _bus.emit(id, "run.completed", VerifyService.map({"status" -> "error", "error" -> String.valueOf(e.Message ?: e.toString())}))
    }
  }

  /** States from which a person may ask for changes (not while the planner or a deploy is running). */
  static final var REVISABLE : List<String> = {"review_pending", "approved", "rejected", "verified_fail", "deploy_failed", "deployed"}

  /**
   * A person asks for changes to the latest proposal. Gemini continues the stored conversation, and the revised
   * proposal is verified as the next iteration (and repaired if blocked). A passed revision needs a NEW approval:
   * an earlier approval never covers it. Returns the revision id.
   */
  function revise(id : String, instruction : String) : String {
    if (instruction == null or instruction.trim().Empty) {
      throw new ApiException(400, "instruction_required", "describe the change you want")
    }
    var exec = _repo.execution(id)
    if (exec == null) {
      throw new ApiException(404, "unknown_execution", "execution not found: " + id)
    }
    if (!(_planner typeis RevisablePlannerPort)) {
      throw new ApiException(409, "revisions_need_live_planner",
          "Changes are made by the live Gemini planner (LLM_MODE=live); this backend runs the " + _mode + " planner")
    }
    var latest = _repo.latestProposalRow(id)
    if (latest == null) {
      throw new ApiException(409, "no_proposal", "this execution has no proposal to change yet")
    }
    var previousStatus = exec.get("status") as String
    if (!_repo.transitionExecution(id, REVISABLE, "planning")) {
      throw new ApiException(409, "not_revisable",
          "execution is '" + previousStatus + "'; changes can be requested once the planner and any deploy have finished")
    }
    var current = Json.parse(latest.get("proposal") as String, Proposal)
    var fromIteration = latest.get("iteration") as int
    var revisionId = _repo.insertRevision(id, instruction.trim(), fromIteration)
    _bus.emit(id, "revision.requested", VerifyService.map({
        "revisionId" -> revisionId, "instruction" -> instruction.trim(), "fromIteration" -> fromIteration,
        "previousStatus" -> previousStatus}))
    var work = \ -> runRevision(id, revisionId, instruction.trim(), current, fromIteration + 1, previousStatus)
    if (_executor == null) {
      work()
    } else {
      _executor.execute(work)
    }
    return revisionId
  }

  private function runRevision(id : String, revisionId : String, instruction : String, current : Proposal,
                               nextIteration : int, previousStatus : String) {
    try {
      var verdict = (_planner as RevisablePlannerPort).revise(id, instruction, current, nextIteration, _verify, _bus, _memory)
      afterVerification(id, verdict)
      var run = _repo.run(verdict.RunId)
      var status = verdict.Status == VerdictStatus.PASSED ? "passed" : "blocked"
      _repo.finishRevision(revisionId, status, run.get("iteration") as Integer, null)
    } catch (e : Throwable) {
      // The change could not be made (model unreachable, no tool calls...): the previous state stands, unchanged.
      var msg = String.valueOf(e.Message ?: e.toString())
      _repo.finishRevision(revisionId, "failed", null, msg)
      _repo.setExecutionStatus(id, previousStatus)
      _bus.emit(id, "revision.failed", VerifyService.map({"revisionId" -> revisionId, "reason" -> msg,
          "restoredStatus" -> previousStatus}))
    }
  }

  property get Memory() : ConversationStore {
    return _memory
  }

  /** Moves the execution on after a verdict: PASSED → review queue, BLOCKED → stays blocked. */
  function afterVerification(id : String, verdict : Verdict) {
    if (verdict == null) {
      throw new IllegalStateException("planner returned no verdict")
    }
    var run = _repo.run(verdict.RunId)
    if (run == null or run.get("execution_id") != id) {
      // The verdict must come from VerifyService for THIS execution; anything else is ignored.
      throw new IllegalStateException("verdict " + verdict.RunId + " was not produced by the verifier for " + id)
    }
    var iterations = run.get("iteration") as int
    if (verdict.Status == VerdictStatus.PASSED) {
      _repo.setExecutionStatus(id, "review_pending")
      _bus.emit(id, "review.requested", VerifyService.map({
          "runId" -> verdict.RunId, "iteration" -> iterations, "verdictHash" -> verdict.VerdictHash,
          "reviewers" -> _repo.users().where(\ u -> u.get("role") == "reviewer").map(\ u -> u.get("full_name"))}))
    } else {
      _repo.setExecutionStatus(id, "verified_fail")
      _bus.emit(id, "run.completed", VerifyService.map({"status" -> "blocked", "iterations" -> iterations, "runId" -> verdict.RunId}))
    }
  }
}
