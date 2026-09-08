/**
 * Scheduler Service (Pure Function - NO LLM Calls)
 * 
 * Generates an optimized multi-day study schedule mapping questions to days.
 * 
 * @param {Array<{ id: string, category?: string }>} questions - Generated questions.
 * @param {Array<{ id: string, kind?: string }>} requirements - Extracted requirements.
 * @param {number} daysAvailable - Total days remaining until interview.
 * @returns {{ days_available: number, days: Array<{ day: number, focus: string, question_ids: string[], minutes: number }> }}
 */
function buildSchedule(questions = [], requirements = [], daysAvailable = 7) {
  const totalDays = Math.max(1, parseInt(daysAvailable, 10) || 7);
  const scheduledDays = [];

  if (!Array.isArray(questions) || questions.length === 0) {
    for (let day = 1; day <= totalDays; day++) {
      scheduledDays.push({
        day,
        focus: `Day ${day} Study Session`,
        question_ids: [],
        minutes: 30,
      });
    }
    return { days_available: totalDays, days: scheduledDays };
  }

  // Partition questions by index evenly across days
  const perDay = Math.ceil(questions.length / totalDays);

  for (let d = 0; d < totalDays; d++) {
    const dayNumber = d + 1;
    const startIndex = d * perDay;
    const dayQuestions = questions.slice(startIndex, startIndex + perDay);
    const questionIds = dayQuestions.map((q) => q.id);

    // Determine focus based on dominant category of questions for this day
    const categories = dayQuestions.map((q) => q.category).filter(Boolean);
    const dominantCategory = categories.length > 0 ? categories[0] : 'General Review';

    // Estimate minutes (~15 mins per question, min 30)
    const minutes = Math.max(30, questionIds.length * 15);

    scheduledDays.push({
      day: dayNumber,
      focus: `Day ${dayNumber}: ${dominantCategory.replace('-', ' ').toUpperCase()} Focus`,
      question_ids: questionIds,
      minutes,
    });
  }

  return {
    days_available: totalDays,
    days: scheduledDays,
  };
}

module.exports = {
  buildSchedule,
};
