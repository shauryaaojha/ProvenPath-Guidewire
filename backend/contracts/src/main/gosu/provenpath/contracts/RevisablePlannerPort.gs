package provenpath.contracts

/**
 * A planner that keeps its conversation in a ConversationPort and can take change requests on a proposal it made.
 * It still only PROPOSES: every verdict comes from VerifyPort, unchanged, and a revision goes through the full
 * gate again (and needs a new approval).
 */
interface RevisablePlannerPort extends PlannerPort {

  /** Same as run(), recording every model turn in memory. */
  function runWithMemory(executionId : String, prompt : String, verifier : VerifyPort, events : EventPort, memory : ConversationPort) : Verdict

  /**
   * Applies a person's change request to the current proposal, continuing the stored conversation.
   * The revised proposal is verified as iteration nextIteration (then repaired if blocked). Returns the LAST verdict.
   * Throws if the model cannot be reached: a revision never silently falls back to a canned proposal.
   */
  function revise(executionId : String, instruction : String, current : Proposal, nextIteration : int,
                  verifier : VerifyPort, events : EventPort, memory : ConversationPort) : Verdict
}
