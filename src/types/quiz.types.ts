export interface Quiz {
  id: number;
  title: string;
  language: string;
  author_id: number;
  status: string;
  type: string;
  subject_id: number;
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
  created_at?: string;
  updated_at?: string;
}

export interface Answer {
  id: number;
  question_id: number;
  text: string;
  is_correct: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateQuizRequest {
  title: string;
  language: string;
  status: string;
  type: string;
  subject_id: number;
}
export interface UpdateQuizRequest {
  title?: string;
  language?: string;
  status?: string;
  type?: string;
  subject_id?: number;
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
