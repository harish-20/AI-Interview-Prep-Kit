const { validateKitStructure } = require('../src/services/validation');

describe('Validation Service (validateKitStructure)', () => {
  it('should return valid=true for a complete, compliant Appendix A kit object', () => {
    const validKit = {
      status: 'ready',
      source: {
        company: 'Acme Corp',
        company_url: 'https://acme.com',
        role: 'Senior Software Engineer',
        location: 'Remote',
        jd_chars: 1200,
        researched_at: new Date().toISOString(),
        pages_used: ['https://acme.com/about'],
      },
      company_brief: {
        summary: 'Acme builds widgets.',
        what_they_do: 'Widget manufacturing.',
        sources: ['https://acme.com'],
      },
      role: {
        title: 'Senior Software Engineer',
        seniority: 'Senior',
        responsibilities: ['Build APIs'],
        requirements: [
          { id: 'req_1', text: 'JavaScript', kind: 'technical', priority: 'must' },
        ],
      },
      questions: [
        {
          id: 'q_1',
          requirement_ids: ['req_1'],
          category: 'technical',
          prompt: 'Explain JS closures.',
          answer_outline: 'Explain scope chain.',
          difficulty: 2,
        },
      ],
      flashcards: [
        {
          id: 'fc_1',
          front: 'What is a Closure?',
          back: 'A function bound to its lexical environment.',
          requirement_ids: ['req_1'],
        },
      ],
      schedule: {
        days_available: 7,
        days: [
          { day: 1, focus: 'JS Fundamentals', question_ids: ['q_1'], minutes: 30 },
        ],
      },
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
      },
    };

    const result = validateKitStructure(validKit);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should return valid=false and report specific errors for invalid or missing fields', () => {
    const invalidKit = {
      status: 'invalid_status_value',
      source: 'not_an_object',
      role: {
        requirements: [
          { id: 'req_1', text: 'Text', kind: 'invalid_kind', priority: 'invalid_priority' },
        ],
      },
      questions: [
        { id: 'q_1', category: 'invalid_category', difficulty: 99 },
      ],
    };

    const result = validateKitStructure(invalidKit);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('status'))).toBe(true);
    expect(result.errors.some((e) => e.includes('kind'))).toBe(true);
    expect(result.errors.some((e) => e.includes('category'))).toBe(true);
  });
});
