import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizApi } from '../../../api';
import { QuizType } from '../../../types/quiz.types';
import { LANGUAGES, ROUTES } from '../../../constants';
import { commonSubjectApi } from '../../../api';
import type { CommonSubjectLookupItem } from '../../../types/common_subject.types';
import type { QuizFormData } from '../../../components/quiz/QuizFormModal';
import '../../quiz.css';

const BLANK_FORM: QuizFormData = {
  title: '',
  language: '',
  type: QuizType.ENT,
  common_subject_id: '',
};

export function CreateQuizPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<QuizFormData>(BLANK_FORM);
  const [subjects, setSubjects] = useState<CommonSubjectLookupItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    commonSubjectApi.lookup(controller.signal).then(setSubjects).catch(() => {});
    return () => controller.abort();
  }, []);

  function update(field: keyof QuizFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await quizApi.create({
        title: form.title,
        language: form.language,
        type: form.type,
        common_subject_id: Number(form.common_subject_id),
      });
      navigate(ROUTES.QUIZZES);
    } catch {
      setError(t('quiz.management.createFailed'));
      setSaving(false);
    }
  }

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.QUIZZES)}>
            {t('common.back')}
          </button>
          <h1 className="qm-page-title">{t('quiz.form.newQuiz')}</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-create-card">
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
            <button className="qm-btn qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZZES)}>
              {t('common.cancel')}
            </button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={() => void handleSubmit()}
              disabled={saving || !form.title.trim()}
            >
              {saving ? t('common.saving') : t('common.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
