package provenpath.app.services

uses java.util.ArrayList
uses java.util.List
uses java.util.Map
uses provenpath.app.db.Repository
uses provenpath.contracts.ConversationPort
uses provenpath.contracts.Json

/**
 * The planner's memory, kept in pp_conversation_turn (append-only, survives restarts). Each turn is the model's
 * {role, parts} content, stored verbatim so a revision replays exactly what the model saw and said.
 */
class ConversationStore implements ConversationPort {

  var _repo : Repository

  construct(repo : Repository) {
    _repo = repo
  }

  override function load(executionId : String) : List<Map<String, Object>> {
    var result = new ArrayList<Map<String, Object>>()
    for (row in _repo.turns(executionId)) {
      result.add(Json.MAPPER.readValue(row.get("content") as String, Map) as Map<String, Object>)
    }
    return result
  }

  override function append(executionId : String, kind : String, turn : Map<String, Object>) {
    var role = (turn.get("role") as String) ?: "user"
    _repo.appendTurn(executionId, role, kind, Json.MAPPER.writeValueAsString(turn))
  }

  /**
   * A readable view of the memory for Mission Control: who said what, without thought signatures or raw JSON.
   */
  function summary(executionId : String) : List<Map<String, Object>> {
    var out = new ArrayList<Map<String, Object>>()
    for (row in _repo.turns(executionId)) {
      var content = Json.MAPPER.readValue(row.get("content") as String, Map) as Map<String, Object>
      var texts = new ArrayList<String>()
      var tools = new ArrayList<String>()
      for (part in (content.get("parts") as List<Object>) ?: new ArrayList<Object>()) {
        var p = part as Map<String, Object>
        if (p.get("text") != null and !(p.get("thought") == true)) texts.add(p.get("text") as String)
        if (p.get("functionCall") != null) tools.add(((p.get("functionCall") as Map<String, Object>).get("name") as String) + "()")
        if (p.get("functionResponse") != null) tools.add("result of " + ((p.get("functionResponse") as Map<String, Object>).get("name") as String))
      }
      out.add(VerifyService.map({"seq" -> row.get("seq"), "role" -> row.get("role"), "kind" -> row.get("kind"),
          "text" -> texts.join("\n"), "tools" -> tools, "createdAt" -> row.get("created_at")}))
    }
    return out
  }
}
