const { buildSchedule } = require('../src/services/scheduler');

describe('Scheduler Service (buildSchedule)', () => {
  it('should generate a study schedule with the requested days_available', () => {
    const questions = [
      { id: 'q_1', category: 'technical' },
      { id: 'q_2', category: 'technical' },
      { id: 'q_3', category: 'behavioural' },
      { id: 'q_4', category: 'system-design' },
    ];
    const requirements = [{ id: 'req_1' }];
    const daysAvailable = 5;

    const schedule = buildSchedule(questions, requirements, daysAvailable);

    expect(schedule.days_available).toBe(5);
    expect(schedule.days).toHaveLength(5);
    expect(schedule.days[0]).toHaveProperty('day', 1);
    expect(schedule.days[0]).toHaveProperty('focus');
    expect(schedule.days[0]).toHaveProperty('question_ids');
    expect(schedule.days[0]).toHaveProperty('minutes');
  });

  it('should distribute questions across days without omitting any questions', () => {
    const questions = [
      { id: 'q_1', category: 'technical' },
      { id: 'q_2', category: 'behavioural' },
    ];
    const schedule = buildSchedule(questions, [], 2);

    const scheduledIds = schedule.days.flatMap((d) => d.question_ids);
    expect(scheduledIds).toContain('q_1');
    expect(scheduledIds).toContain('q_2');
  });

  it('should fallback gracefully when no questions are provided', () => {
    const schedule = buildSchedule([], [], 3);
    expect(schedule.days_available).toBe(3);
    expect(schedule.days).toHaveLength(3);
    expect(schedule.days[0].question_ids).toEqual([]);
    expect(schedule.days[0].minutes).toBeGreaterThanOrEqual(30);
  });
});
