import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

export interface QuizFormData {
  title: string;
  language: string;
  status: string;
  type: string;
  common_subject_id: string;
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
            <input
              className="qm-input"
              value={form.language}
              onChange={update('language')}
              placeholder={t('quiz.form.languagePlaceholder')}
            />
          </div>
          <div className="qm-field">
            <label className="qm-label">{t('quiz.form.status')}</label>
            <select className="qm-input qm-select" value={form.status} onChange={update('status')}>
              <option value="draft">{t('quiz.form.statusDraft')}</option>
              <option value="active">{t('quiz.form.statusActive')}</option>
              <option value="inactive">{t('quiz.form.statusInactive')}</option>
            </select>
          </div>
        </div>
        <div className="qm-field-row">
          <div className="qm-field">
            <label className="qm-label">{t('quiz.form.type')}</label>
            <input
              className="qm-input"
              value={form.type}
              onChange={update('type')}
              placeholder={t('quiz.form.typePlaceholder')}
            />
          </div>
          <div className="qm-field">
            <label className="qm-label">{t('quiz.form.commonSubjectId')}</label>
            <input
              className="qm-input"
              type="number"
              value={form.common_subject_id}
              onChange={update('common_subject_id')}
              placeholder="0"
            />
          </div>
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
