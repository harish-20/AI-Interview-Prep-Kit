const mongoose = require('mongoose');

/**
 * Kit Schema
 * 
 * NOTE ON `edited` AND `pinned` FLAGS:
 * The `edited` and `pinned` boolean properties attached to each item in `questions`
 * and `flashcards` represent internal database state for user customizations.
 * 
 * When a user regenerates or updates a Kit:
 *  - `pinned: true` indicates questions/flashcards that MUST be preserved across pipeline runs.
 *  - `edited: true` indicates items modified by the user that should not be overwritten automatically.
 * 
 * Note that `edited` and `pinned` are NOT part of the external Appendix A output schema.
 * They must be stripped before serializing and returning the Kit payload to external
 * API consumers or the CLI batch evaluation tool.
 */

const requirementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    kind: {
      type: String,
      enum: ['technical', 'behavioural', 'domain'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['must', 'nice'],
      required: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    requirement_ids: [{ type: String }],
    category: {
      type: String,
      enum: ['technical', 'behavioural', 'system-design', 'company-fit'],
      required: true,
    },
    prompt: { type: String, required: true },
    answer_outline: { type: String, required: true },
    difficulty: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    // Flags for state preservation during incremental updates / regeneration
    edited: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
  },
  { _id: false }
);

const flashcardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: [{ type: String }],
    // Flags for state preservation during incremental updates / regeneration
    edited: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
  },
  { _id: false }
);

const scheduleDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    question_ids: [{ type: String }],
    minutes: { type: Number, required: true },
  },
  { _id: false }
);

const kitSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
      required: true,
    },
    source: {
      company: { type: String, default: '' },
      company_url: { type: String, default: '' },
      role: { type: String, default: '' },
      location: { type: String, default: '' },
      jd_chars: { type: Number, default: 0 },
      researched_at: { type: Date, default: Date.now },
      pages_used: [{ type: String }],
    },
    company_brief: {
      summary: { type: String, default: '' },
      what_they_do: { type: String, default: '' },
      sources: [{ type: String }],
    },
    role: {
      title: { type: String, default: '' },
      seniority: { type: String, default: '' },
      responsibilities: [{ type: String }],
      requirements: [requirementSchema],
    },
    questions: [questionSchema],
    flashcards: [flashcardSchema],
    schedule: {
      days_available: { type: Number, default: 7 },
      days: [scheduleDaySchema],
    },
    coverage: {
      uncovered_requirement_ids: [{ type: String }],
      passes: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Kit', kitSchema);
