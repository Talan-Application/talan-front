import { apiClient } from './client';
import type { Answer, CreateAnswerRequest, UpdateAnswerRequest, GetAllAnswersResponse, AnswerResponse } from '../types/quiz.types';

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const v = Object.values(data as Record<string, unknown>).find(Array.isArray);
    if (v) return v as T[];
  }
  return [];
}

export const answerApi = {
  getAll: () => apiClient.get('/answers').then(r => toArray<Answer>(r.data)),
  getByQuestionId: (questionId: number, params: { limit: number; offset: number }) =>
    apiClient.get<GetAllAnswersResponse>(`/questions/${questionId}/answers`, { params })
      .then(r => (r.data.answers ?? []) as AnswerResponse[]),
  getById: (id: number) => apiClient.get<Answer>(`/answers/${id}`).then(r => r.data),
  create: (data: CreateAnswerRequest) => apiClient.post<Answer>('/answers', data).then(r => r.data),
  update: (id: number, data: UpdateAnswerRequest) => apiClient.put<Answer>(`/answers/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/answers/${id}`),
};
