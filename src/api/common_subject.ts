import { apiClient } from './client';
import { toArray } from '../utils/api';
import type {
  CommonSubject, CreateCommonSubjectRequest, UpdateCommonSubjectRequest, DeleteCommonSubjectResponse,
} from '../types/common_subject.types';

export const commonSubjectApi = {
  getAll: (params: { limit: number; offset: number }, signal?: AbortSignal) =>
    apiClient.get('/common-subjects', { params, signal }).then(r => toArray<CommonSubject>(r.data)),

  getById: (id: number) =>
    apiClient.get<CommonSubject>(`/common-subjects/${id}`).then(r => r.data),

  create: (data: CreateCommonSubjectRequest) =>
    apiClient.post<CommonSubject>('/common-subjects', data).then(r => r.data),

  update: (id: number, data: UpdateCommonSubjectRequest) =>
    apiClient.put<CommonSubject>(`/common-subjects/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete<DeleteCommonSubjectResponse>(`/common-subjects/${id}`).then(r => r.data),
};
