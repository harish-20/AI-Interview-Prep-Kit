/**
 * Coverage Service (Pure Function - NO LLM Calls)
 * 
 * Computes which role requirements are uncovered by the current set of questions.
 * 
 * @param {Array<{ id: string }>} requirements - Array of requirement objects.
 * @param {Array<{ requirement_ids?: string[] }>} questions - Array of question objects.
 * @param {number} [currentPasses=0] - Current pass count in the gap-filling loop.
 * @returns {{ uncovered_requirement_ids: string[], passes: number }}
 */
function checkCoverage(requirements = [], questions = [], currentPasses = 0) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return { uncovered_requirement_ids: [], passes: currentPasses };
  }

  // Collect set of requirement IDs covered by at least one question
  const coveredIds = new Set();
  if (Array.isArray(questions)) {
    for (const q of questions) {
      if (Array.isArray(q.requirement_ids)) {
        for (const reqId of q.requirement_ids) {
          coveredIds.add(reqId);
        }
      }
    }
  }

  // Find requirement IDs that are not covered
  const uncovered_requirement_ids = requirements
    .map((r) => r.id)
    .filter((reqId) => reqId && !coveredIds.has(reqId));

  return {
    uncovered_requirement_ids,
    passes: currentPasses,
  };
}

module.exports = {
  checkCoverage,
};
