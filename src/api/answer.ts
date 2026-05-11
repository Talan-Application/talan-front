import { apiClient } from './client';
import type { Answer, CreateAnswerRequest, UpdateAnswerRequest } from '../types/quiz.types';

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
  getById: (id: number) => apiClient.get<Answer>(`/answers/${id}`).then(r => r.data),
  create: (data: CreateAnswerRequest) => apiClient.post<Answer>('/answers', data).then(r => r.data),
  update: (id: number, data: UpdateAnswerRequest) => apiClient.put<Answer>(`/answers/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/answers/${id}`),
};
