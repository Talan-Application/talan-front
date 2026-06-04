export const QuizType = {
  ENT: "ent",
  MONTHLY_EXAM: "monthly_exam",
  EXAM: "exam",
} as const;

export type QuizType = typeof QuizType[keyof typeof QuizType];

export const QuizStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type QuizStatus = typeof QuizStatus[keyof typeof QuizStatus];

export interface Quiz {
  id: number;
  title: string;
  language: string;
  author_id: number;
  status: QuizStatus;
  type: QuizType;
  common_subject_id: number;
  is_ent_standard: boolean;
  created_at: number;
  updated_at: number;
}

export interface Question {
  id: number;
  quiz_id: number;
  text: string;
  context?: string;
  video_answer_url?: string;
  order?: number;
  created_at?: number;
  updated_at?: number;
}

export interface Answer {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
  created_at?: number;
  updated_at?: number;
}

// ── API response shapes for list endpoints ────────────────────────────────────

export interface QuestionResponse {
  id: number;
  quiz_id: number;
  text: string;
  context: string;
  video_answer_url: string;
  order: number;
  created_at: number;
  updated_at: number;
}

export interface GetAllQuestionsResponse {
  questions: QuestionResponse[];
}

export interface AnswerResponse {
  id: number;
  question_id: number;
  text: string;
  correct: boolean;
  created_at: number;
  updated_at: number;
}

export interface GetAllAnswersResponse {
  answers: AnswerResponse[];
}

export interface CreateQuizRequest {
  title: string;
  language: string;
  type: QuizType;
  common_subject_id: number;
  is_ent_standard: boolean;
}
export interface UpdateQuizRequest {
  title: string;
  language: string;
  type: QuizType;
  is_ent_standard: boolean;
}
export interface CreateQuestionRequest {
  quiz_id: number;
  text: string;
  context?: string;
  video_answer_url?: string;
  order?: number;
}
export interface UpdateQuestionRequest {
  quiz_id?: number;
  text?: string;
  context?: string;
  video_answer_url?: string;
  order?: number;
}
export interface CreateAnswerRequest { question_id: number; text: string; is_correct: boolean; }
export interface UpdateAnswerRequest { question_id?: number; text?: string; is_correct?: boolean; }

// ── Take quiz ──────────────────────────────────────────────────────────────────

export interface TakeQuizAnswer {
  id: number;
  text: string;
}

export interface TakeQuizQuestion {
  id: number;
  text: string;
  context: string;
  video_answer_url: string;
  order: number;
  answers: TakeQuizAnswer[];
}

export interface TakeQuizResponse {
  quiz: Quiz;
  questions: TakeQuizQuestion[];
}

// ── Submit quiz ────────────────────────────────────────────────────────────────

export interface QuizAnswerSubmission {
  question_id: number;
  answer_ids: number[];
}

export interface SubmitQuizRequest {
  answers: QuizAnswerSubmission[];
}

export interface QuestionResult {
  question_id: number;
  selected_answer_ids: number[];
  correct_answer_ids: number[];
  score: number;
  max_score: number;
}

export interface SubmitQuizResponse {
  result_id: number;
  total_questions_count: number;
  correct_answers_count: number;
  incorrect_answers_count: number;
  unanswered_questions: number;
  score: number;
  max_score: number;
  results: QuestionResult[];
}

// ── Results history ────────────────────────────────────────────────────────────

export interface QuizResultSummary {
  id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  submitted_at: number;
}

export interface GetQuizResultsResponse {
  results: QuizResultSummary[];
}
