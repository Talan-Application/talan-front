import { apiClient } from './client';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest } from '../types/quiz.types';

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const v = Object.values(data as Record<string, unknown>).find(Array.isArray);
    if (v) return v as T[];
  }
  return [];
}

export const questionApi = {
  getAll: () => apiClient.get('/questions').then(r => toArray<Question>(r.data)),
  getById: (id: number) => apiClient.get<Question>(`/questions/${id}`).then(r => r.data),
  create: (data: CreateQuestionRequest) => apiClient.post<Question>('/questions', data).then(r => r.data),
  update: (id: number, data: UpdateQuestionRequest) => apiClient.put<Question>(`/questions/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/questions/${id}`),
};
