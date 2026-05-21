import { apiClient } from './client';
import { toArray } from '../utils/api';
import type {
  Answer, CreateAnswerRequest, UpdateAnswerRequest,
  GetAllAnswersResponse, AnswerResponse,
} from '../types/quiz.types';

export const answerApi = {
  getAll: () =>
    apiClient.get('/answers').then(r => toArray<Answer>(r.data)),

  getByQuestionId: (questionId: number, params: { limit: number; offset: number }) =>
    apiClient
      .get<GetAllAnswersResponse>(`/questions/${questionId}/answers`, { params })
      .then(r => (r.data.answers ?? []) as AnswerResponse[]),

  getById: (id: number) =>
    apiClient.get<Answer>(`/answers/${id}`).then(r => r.data),

  create: (data: CreateAnswerRequest) =>
    apiClient.post<Answer>('/answers', data).then(r => r.data),

  update: (id: number, data: UpdateAnswerRequest) =>
    apiClient.put<Answer>(`/answers/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/answers/${id}`),
};
