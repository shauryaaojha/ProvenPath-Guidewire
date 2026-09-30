package provenpath.app

uses java.io.File
uses java.nio.charset.StandardCharsets
uses java.nio.file.Files
uses java.util.ArrayList
uses java.util.LinkedHashMap
uses java.util.Map
uses java.util.regex.Pattern
uses provenpath.contracts.ConversationPort
uses provenpath.contracts.EventPort
uses provenpath.contracts.Json
uses provenpath.contracts.Proposal
uses provenpath.contracts.RevisablePlannerPort
uses provenpath.contracts.Verdict
uses provenpath.contracts.VerifyPort

/**
 * Test stand-in for the Gemini planner: proposes the compliant demo fixture, and understands one kind of change
 * request ("extortion limit to N"). It records its turns in the ConversationPort like the real planner, and says
 * in its reply how many turns of memory it was given, so tests can check the memory reaches it.
 */
class TestRevisablePlanner implements RevisablePlannerPort {

  override function run(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort) : Verdict {
    return runWithMemory(executionId, prompt, verifier, events, null)
  }

  override function runWithMemory(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort,
                                  memory : ConversationPort) : Verdict {
    memory?.append(executionId, "request", turn("user", "Please create: " + prompt))
    var f = new File(System.getenv("PROVENPATH_FIXTURES_DIR"), "proposal_demo_fixed.json")
    var p = Json.parse(new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8), Proposal)
    p.ExecutionId = executionId
    p.ProposalId = "PP-TEST"
    p.Iteration = 1
    memory?.append(executionId, "model", turn("model", "Proposed " + p.Clauses.size() + " clauses"))
    return verifier.verify(p)
  }

  override function revise(executionId : String, instruction : String, current : Proposal, nextIteration : int,
                           verifier : VerifyPort, events : EventPort, memory : ConversationPort) : Verdict {
    var seen = memory.load(executionId).size()
    memory.append(executionId, "revision", turn("user", instruction))
    var m = Pattern.compile("extortion limit to (\\d+)").matcher(instruction)
    if (!m.find()) {
      throw new IllegalStateException("cannot understand the change: " + instruction)
    }
    var p = Json.parse(Json.canonical(current), Proposal)
    p.Iteration = nextIteration
    p.Clauses.firstWhere(\ c -> c.PatternCode == "SMCyberExtortionCov").LimitMaxInr = Long.parseLong(m.group(1))
    memory.append(executionId, "model", turn("model", "Changed the extortion limit; I was given " + seen + " earlier turns"))
    return verifier.verify(p)
  }

  static function turn(role : String, text : String) : Map<String, Object> {
    var part = new LinkedHashMap<String, Object>()
    part.put("text", text)
    var parts = new ArrayList<Object>()
    parts.add(part)
    var t = new LinkedHashMap<String, Object>()
    t.put("role", role)
    t.put("parts", parts)
    return t
  }
}
