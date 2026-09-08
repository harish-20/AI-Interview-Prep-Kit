/**
 * Schema Validation Service (Pure Function - Appendix A Schema)
 * 
 * Validates that a kit object strictly conforms to the Appendix A contract.
 * 
 * @param {object} kit - Kit data structure to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateKitStructure(kit) {
  const errors = [];

  if (!kit || typeof kit !== 'object') {
    return { valid: false, errors: ['Kit payload must be a non-null object.'] };
  }

  // Top-level field validation
  const validStatuses = ['generating', 'ready', 'failed'];
  if (!kit.status || !validStatuses.includes(kit.status)) {
    errors.push(`Kit status must be one of: ${validStatuses.join(', ')}.`);
  }

  if (!kit.source || typeof kit.source !== 'object') {
    errors.push('Kit source must be an object.');
  }

  if (!kit.company_brief || typeof kit.company_brief !== 'object') {
    errors.push('Kit company_brief must be an object.');
  }

  if (!kit.role || typeof kit.role !== 'object') {
    errors.push('Kit role must be an object.');
  } else {
    if (!Array.isArray(kit.role.requirements)) {
      errors.push('Kit role.requirements must be an array.');
    } else {
      kit.role.requirements.forEach((req, idx) => {
        if (!req.id || typeof req.id !== 'string') {
          errors.push(`Requirement at index ${idx} missing valid 'id'.`);
        }
        if (!['technical', 'behavioural', 'domain'].includes(req.kind)) {
          errors.push(`Requirement ${req.id || idx} has invalid 'kind': ${req.kind}.`);
        }
        if (!['must', 'nice'].includes(req.priority)) {
          errors.push(`Requirement ${req.id || idx} has invalid 'priority': ${req.priority}.`);
        }
      });
    }
  }

  if (!Array.isArray(kit.questions)) {
    errors.push('Kit questions must be an array.');
  } else {
    kit.questions.forEach((q, idx) => {
      if (!q.id || typeof q.id !== 'string') {
        errors.push(`Question at index ${idx} missing valid 'id'.`);
      }
      if (!['technical', 'behavioural', 'system-design', 'company-fit'].includes(q.category)) {
        errors.push(`Question ${q.id || idx} has invalid 'category': ${q.category}.`);
      }
      if (![1, 2, 3].includes(q.difficulty)) {
        errors.push(`Question ${q.id || idx} has invalid 'difficulty': ${q.difficulty}.`);
      }
    });
  }

  if (!Array.isArray(kit.flashcards)) {
    errors.push('Kit flashcards must be an array.');
  }

  if (!kit.schedule || typeof kit.schedule !== 'object') {
    errors.push('Kit schedule must be an object.');
  } else {
    if (typeof kit.schedule.days_available !== 'number') {
      errors.push('Kit schedule.days_available must be a number.');
    }
    if (!Array.isArray(kit.schedule.days)) {
      errors.push('Kit schedule.days must be an array.');
    }
  }

  if (!kit.coverage || typeof kit.coverage !== 'object') {
    errors.push('Kit coverage must be an object.');
  } else {
    if (!Array.isArray(kit.coverage.uncovered_requirement_ids)) {
      errors.push('Kit coverage.uncovered_requirement_ids must be an array.');
    }
    if (typeof kit.coverage.passes !== 'number') {
      errors.push('Kit coverage.passes must be a number.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateKitStructure,
};
