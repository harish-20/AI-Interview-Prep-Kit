const { checkCoverage } = require('../src/services/coverage');

describe('Coverage Service (checkCoverage)', () => {
  it('should return empty uncovered_requirement_ids when all requirements are mapped by questions', () => {
    const requirements = [
      { id: 'req_1', text: 'Node.js', kind: 'technical', priority: 'must' },
      { id: 'req_2', text: 'MongoDB', kind: 'technical', priority: 'must' },
    ];

    const questions = [
      { id: 'q_1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Node.js prompt' },
      { id: 'q_2', requirement_ids: ['req_2'], category: 'technical', prompt: 'MongoDB prompt' },
    ];

    const result = checkCoverage(requirements, questions, 1);

    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.passes).toBe(1);
  });

  it('should identify uncovered requirement IDs when questions are missing for some requirements', () => {
    const requirements = [
      { id: 'req_1', text: 'Node.js', kind: 'technical', priority: 'must' },
      { id: 'req_2', text: 'MongoDB', kind: 'technical', priority: 'must' },
      { id: 'req_3', text: 'System Design', kind: 'technical', priority: 'nice' },
    ];

    const questions = [
      { id: 'q_1', requirement_ids: ['req_1'], category: 'technical', prompt: 'Node.js prompt' },
    ];

    const result = checkCoverage(requirements, questions, 0);

    expect(result.uncovered_requirement_ids).toEqual(['req_2', 'req_3']);
    expect(result.passes).toBe(0);
  });

  it('should handle empty requirements or questions gracefully', () => {
    const result = checkCoverage([], [], 0);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.passes).toBe(0);
  });
});
