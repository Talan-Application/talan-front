import { apiClient } from './client';
import { toArray } from '../utils/api';
import type {
  Question, CreateQuestionRequest, UpdateQuestionRequest,
  GetAllQuestionsResponse, QuestionResponse,
} from '../types/quiz.types';

export const questionApi = {
  getAll: () =>
    apiClient.get('/questions').then(r => toArray<Question>(r.data)),

  getByQuizId: (quizId: number, params: { limit: number; offset: number }, signal?: AbortSignal) =>
    apiClient
      .get<GetAllQuestionsResponse>(`/quizzes/${quizId}/questions`, { params, signal })
      .then(r => (r.data.questions ?? []) as QuestionResponse[]),

  getById: (id: number) =>
    apiClient.get<Question>(`/questions/${id}`).then(r => r.data),

  create: (data: CreateQuestionRequest) =>
    apiClient.post<Question>('/questions', data).then(r => r.data),

  update: (id: number, data: UpdateQuestionRequest) =>
    apiClient.put<Question>(`/questions/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/questions/${id}`),
};
