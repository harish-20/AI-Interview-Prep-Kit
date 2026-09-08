const { withRetry } = require('../utils/retry');
const { callLLMJSON } = require('./llm');

/**
 * Generation Service
 * Handles LLM prompt construction and artifact generation using Groq.
 */

/**
 * Generates company overview and culture brief.
 */
async function generateCompanyBrief(companyName, scrapedPages = [], researchSnippets = []) {
  return withRetry(async () => {
    const pagesText = scrapedPages.map((p) => `URL: ${p.url}\nContent: ${p.content}`).join('\n---\n');
    const researchText = researchSnippets.join('\n');

    const systemPrompt = `You are an expert executive company researcher.
Generate a professional summary and product strategy brief for the target company.
CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "summary": "High-level summary of company mission, market focus, and scale",
  "what_they_do": "Detailed breakdown of core products, services, tech stack, and engineering culture"
}`;

    const userPrompt = `
<company_name>${companyName || 'Target Company'}</company_name>

<untrusted_web_content>
${pagesText || 'No scraped web content available.'}
</untrusted_web_content>

<untrusted_forum_snippets>
${researchText || 'No external forum discussions available.'}
</untrusted_forum_snippets>`;

    const sources = scrapedPages.map((p) => p.url).filter(Boolean);
    const llmResult = await callLLMJSON(systemPrompt, userPrompt);

    if (llmResult && llmResult.summary) {
      return {
        summary: llmResult.summary,
        what_they_do: llmResult.what_they_do || 'Develops enterprise cloud software solutions.',
        sources,
      };
    }

    return {
      summary: `${companyName || 'The company'} is an innovative technology company building high-performance web applications and scalable platform solutions.`,
      what_they_do: 'Specializes in cloud infrastructure, modern web APIs, and data engineering.',
      sources,
    };
  });
}

/**
 * Generates tailored interview questions per requirement x category.
 */
async function generateQuestions(requirement, category) {
  return withRetry(async () => {
    const reqId = requirement?.id || 'req_general';
    const reqText = requirement?.text || 'General engineering competency';

    const systemPrompt = `You are a principal hiring manager. Generate an interview question for category "${category}".
CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "prompt": "Specific realistic interview question related to requirement",
  "answer_outline": "Structured bulleted answer guidance with key concepts, trade-offs, and examples",
  "difficulty": 1 | 2 | 3
}`;

    const userPrompt = `
<category>${category}</category>

<untrusted_requirement>
${reqText}
</untrusted_requirement>`;

    const llmResult = await callLLMJSON(systemPrompt, userPrompt);

    const qPrompt = llmResult?.prompt || `Explain your experience and approach regarding: ${reqText}`;
    const qAnswer = llmResult?.answer_outline || `1. Core concepts & trade-offs\n2. Real-world example\n3. Best practices & edge cases`;
    const qDiff = [1, 2, 3].includes(llmResult?.difficulty) ? llmResult.difficulty : 2;

    return [
      {
        id: `q_${reqId}_${category}_${Math.random().toString(36).substring(2, 7)}`,
        requirement_ids: [reqId],
        category,
        prompt: qPrompt,
        answer_outline: qAnswer,
        difficulty: qDiff,
        edited: false,
        pinned: false,
      },
    ];
  });
}

/**
 * Generates study flashcards based on role requirements.
 */
async function generateFlashcards(requirements = []) {
  return withRetry(async () => {
    if (!Array.isArray(requirements) || requirements.length === 0) {
      return [];
    }

    const reqsText = requirements.map((r, i) => `${i + 1}. [ID: ${r.id}] ${r.text}`).join('\n');

    const systemPrompt = `You are a technical interview coach. Create study flashcards for the candidate based on these job requirements.
CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "flashcards": [
    {
      "requirement_id": "req_1",
      "front": "Clear concept question or scenario on front of card",
      "back": "Detailed concise explanation, tradeoffs, and code/design key points"
    }
  ]
}`;

    const userPrompt = `
<requirements>
${reqsText}
</requirements>`;

    const llmResult = await callLLMJSON(systemPrompt, userPrompt);

    if (llmResult && Array.isArray(llmResult.flashcards) && llmResult.flashcards.length > 0) {
      return llmResult.flashcards.map((fc, idx) => ({
        id: `fc_${fc.requirement_id || idx}_${Math.random().toString(36).substring(2, 7)}`,
        front: fc.front || `Key Concept: ${requirements[idx]?.text || 'Core Topic'}`,
        back: fc.back || 'Key takeaways and implementation details.',
        requirement_ids: [fc.requirement_id || requirements[idx]?.id || 'req_general'],
        edited: false,
        pinned: false,
      }));
    }

    return requirements.map((req, idx) => ({
      id: `fc_${req.id || idx}_${Math.random().toString(36).substring(2, 7)}`,
      front: `Key Concept: ${req.text}`,
      back: `Definition & best practices for ${req.text}. Be ready to explain tradeoffs and implementation details.`,
      requirement_ids: [req.id],
      edited: false,
      pinned: false,
    }));
  });
}

module.exports = {
  generateCompanyBrief,
  generateQuestions,
  generateFlashcards,
};
