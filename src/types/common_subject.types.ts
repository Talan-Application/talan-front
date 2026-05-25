export interface CommonSubjectTranslations {
  ru: string;
  kk: string;
}

export interface CommonSubject {
  id: number;
  created_at: string;
  updated_at: string;
  translations: CommonSubjectTranslations;
}

export interface CreateCommonSubjectRequest {
  translations: CommonSubjectTranslations;
}

export interface UpdateCommonSubjectRequest {
  translations: CommonSubjectTranslations;
}

export interface DeleteCommonSubjectResponse {
  message: string;
}
