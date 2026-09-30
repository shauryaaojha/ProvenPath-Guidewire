package provenpath.contracts

uses java.util.List
uses java.util.Map

/**
 * The planner's long-term memory for one execution: every model turn, stored append-only by the backend so a
 * revision days later continues the same conversation, and nothing is lost on a restart.
 * A turn is the model API's "content" object ({role, parts}), stored verbatim.
 */
interface ConversationPort {
  /** Every turn of this execution, oldest first. */
  function load(executionId : String) : List<Map<String, Object>>

  /** Appends one turn. kind: request | revision | model | tool_results | gate_feedback | context. */
  function append(executionId : String, kind : String, turn : Map<String, Object>)
}
