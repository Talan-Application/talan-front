import { apiClient } from './client';
import { toArray } from '../utils/api';
import type {
  Quiz, CreateQuizRequest, UpdateQuizRequest,
  TakeQuizResponse, SubmitQuizRequest, SubmitQuizResponse, GetQuizResultsResponse,
} from '../types/quiz.types';

export const quizApi = {
  getAll: (params: { limit: number; offset: number }, signal?: AbortSignal) =>
    apiClient.get('/quizzes', { params, signal }).then(r => toArray<Quiz>(r.data)),

  getById: (id: number) =>
    apiClient.get<Quiz>(`/quizzes/${id}`).then(r => r.data),

  create: (data: CreateQuizRequest) =>
    apiClient.post<Quiz>('/quizzes', data).then(r => r.data),

  update: (id: number, data: UpdateQuizRequest) =>
    apiClient.put<Quiz>(`/quizzes/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/quizzes/${id}`),

  publish: (id: number) =>
    apiClient.patch(`/quizzes/${id}/publish`),

  takeQuiz: (id: number, signal?: AbortSignal) =>
    apiClient.get<TakeQuizResponse>(`/quizzes/${id}/take`, { signal }).then(r => r.data),

  submitQuiz: (id: number, data: SubmitQuizRequest) =>
    apiClient.post<SubmitQuizResponse>(`/quizzes/${id}/submit`, data).then(r => r.data),

  getResults: (id: number) =>
    apiClient.get<GetQuizResultsResponse>(`/quizzes/${id}/results`).then(r => r.data),
};
