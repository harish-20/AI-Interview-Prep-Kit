export interface User {
  id: string;
  email: string;
}

export type RequirementKind = 'technical' | 'behavioural' | 'domain';
export type RequirementPriority = 'must' | 'nice';

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
}

export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';

export interface Question {
  id: string;
  requirement_ids?: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  edited?: boolean;
  pinned?: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids?: string[];
  confidence?: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  last_reviewed_at?: string;
  edited?: boolean;
  pinned?: boolean;
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface KitSchedule {
  days_available: number;
  days: ScheduleDay[];
}

export interface KitSource {
  company: string;
  company_url: string;
  role: string;
  location?: string;
  jd_chars?: number;
  researched_at?: string;
  pages_used?: string[];
}

export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  sources: string[];
}

export interface RoleInfo {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
}

export interface Coverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

export type KitStatus = 'generating' | 'ready' | 'failed';

export interface Kit {
  _id: string;
  user_id: string;
  status: KitStatus;
  source: KitSource;
  company_brief: CompanyBrief;
  role: RoleInfo;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: KitSchedule;
  coverage: Coverage;
  createdAt?: string;
  updatedAt?: string;
  error?: string;
}

export type PipelineStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface PipelineStep {
  id: 'extract' | 'crawl' | 'research' | 'generate' | 'coverage' | 'schedule';
  label: string;
  status: PipelineStepStatus;
  reason?: string;
  error?: string;
}
