import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { QuizType } from '../../types/quiz.types';
import { LANGUAGES } from '../../constants';
import { commonSubjectApi } from '../../api';
import type { CommonSubjectLookupItem } from '../../types/common_subject.types';

export interface QuizFormData {
  title: string;
  language: string;
  type: QuizType;
  common_subject_id: string;
  is_ent_standard: boolean;
}

interface Props {
  title: string;
  form: QuizFormData;
  onFormChange: (form: QuizFormData) => void;
  error: string;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export function QuizFormModal({ title, form, onFormChange, error, saving, submitLabel, onCancel, onSubmit }: Props) {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState<CommonSubjectLookupItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    commonSubjectApi.lookup(controller.signal).then(setSubjects).catch(() => {});
    return () => controller.abort();
  }, []);

  function update(field: keyof QuizFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onFormChange({ ...form, [field]: e.target.value });
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="qm-step-indicator">
        <div className="qm-step qm-step-active">
          <span className="qm-step-dot">1</span>
          <span>{t('quiz.form.quizDetails')}</span>
        </div>
        <div className="qm-step-line" />
        <div className="qm-step qm-step-pending">
          <span className="qm-step-dot">2</span>
          <span>{t('quiz.form.questionsAnswers')}</span>
        </div>
      </div>

      <div className="qm-form">
        <div className="qm-field">
          <label className="qm-label">{t('quiz.form.titleLabel')}</label>
          <input
            className="qm-input"
            value={form.title}
            onChange={update('title')}
            placeholder={t('quiz.form.titlePlaceholder')}
            autoFocus
          />
        </div>
        <div className="qm-field-row">
          <div className="qm-field">
            <label className="qm-label">{t('quiz.form.language')}</label>
            <select className="qm-input qm-select" value={form.language} onChange={update('language')}>
              <option value="">{t('quiz.form.languagePlaceholder')}</option>
              {LANGUAGES.map(({ languageCode, nativeName }) => (
                <option key={languageCode} value={languageCode}>{nativeName}</option>
              ))}
            </select>
          </div>
          <div className="qm-field">
            <label className="qm-label">{t('quiz.form.type')}</label>
            <select className="qm-input qm-select" value={form.type} onChange={update('type')}>
              <option value={QuizType.ENT}>{t('quiz.types.ent')}</option>
              <option value={QuizType.MONTHLY_EXAM}>{t('quiz.types.monthly_exam')}</option>
              <option value={QuizType.EXAM}>{t('quiz.types.exam')}</option>
            </select>
          </div>
        </div>
        <div className="qm-field">
          <label className="qm-label">{t('quiz.form.commonSubjectId')}</label>
          <select className="qm-input qm-select" value={form.common_subject_id} onChange={update('common_subject_id')}>
            <option value="">{t('quiz.form.commonSubjectPlaceholder')}</option>
            {subjects.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="qm-error qm-error-inline">{error}</p>}

      <div className="qm-modal-footer">
        <button className="qm-btn qm-btn-ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button
          className="qm-btn qm-btn-primary"
          onClick={onSubmit}
          disabled={saving || !form.title.trim()}
        >
          {saving ? t('common.saving') : submitLabel}
        </button>
      </div>
    </Modal>
  );
}
