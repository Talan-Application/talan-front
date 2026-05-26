import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quizApi } from '../../../api';
import { useQuizStore } from '../../../stores/quizStore';
import { QuizType, type Quiz } from '../../../types/quiz.types';
import { PAGE_SIZES, ROUTES } from '../../../constants';
import { QuizCard } from '../../../components/quiz/QuizCard';
import { QuizFormModal, type QuizFormData } from '../../../components/quiz/QuizFormModal';
import { AddQuestionsModal } from '../../../components/quiz/AddQuestionsModal';
import { EditQuestionsModal } from '../../../components/quiz/EditQuestionsModal';
import '../../quiz.css';

type ModalState =
  | { mode: 'create-step1' }
  | { mode: 'create-step2'; quiz: Quiz }
  | { mode: 'edit-step1'; item: Quiz }
  | { mode: 'edit-step2'; quiz: Quiz };

const BLANK_FORM: QuizFormData = {
  title: '',
  language: '',
  type: QuizType.ENT,
  common_subject_id: '',
};

export function QuizManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, error, limit, offset, hasMore, setLimit, setOffset, fetchQuizzes } = useQuizStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<QuizFormData>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void fetchQuizzes(controller.signal);
    return () => controller.abort();
  }, [limit, offset, fetchQuizzes]);

  function openCreate() {
    setForm(BLANK_FORM);
    setFormError('');
    setModal({ mode: 'create-step1' });
  }

  function openEdit(item: Quiz) {
    setForm({
      title: item.title,
      language: item.language,
      type: item.type,
      common_subject_id: String(item.common_subject_id),
    });
    setFormError('');
    setModal({ mode: 'edit-step1', item });
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      const quiz = await quizApi.create({
        title: form.title,
        language: form.language,
        type: form.type,
        common_subject_id: Number(form.common_subject_id),
      });
      await fetchQuizzes();
      setModal({ mode: 'create-step2', quiz });
    } catch {
      setFormError(t('quiz.management.createFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (modal?.mode !== 'edit-step1' || !form.title.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await quizApi.update(modal.item.id, {
        title: form.title,
        language: form.language,
        type: form.type,
        common_subject_id: Number(form.common_subject_id),
      });
      await fetchQuizzes();
      setModal({
        mode: 'edit-step2',
        quiz: {
          ...modal.item,
          title: form.title,
          language: form.language,
          type: form.type,
          common_subject_id: Number(form.common_subject_id),
        },
      });
    } catch {
      setFormError(t('quiz.management.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: number) {
    try {
      await quizApi.publish(id);
      await fetchQuizzes();
    } catch {
      setDeleteError(t('quiz.management.publishFailed'));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t('quiz.management.deleteConfirm'))) return;
    setDeleteError('');
    try {
      await quizApi.delete(id);
      await fetchQuizzes();
    } catch {
      setDeleteError(t('quiz.management.deleteFailed'));
    }
  }

  async function closeModal() {
    setModal(null);
    await fetchQuizzes();
  }

  const page = Math.floor(offset / limit) + 1;

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>{t('common.home')}</button>
          <h1 className="qm-page-title">{t('quiz.management.title')}</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <div className="qm-toolbar-left">
            <label className="qm-per-page-label">{t('common.perPage')}</label>
            <select
              className="qm-per-page"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="qm-btn qm-btn-primary" onClick={openCreate}>{t('quiz.management.newQuiz')}</button>
        </div>

        {(error || deleteError) && <p className="qm-error">{error || deleteError}</p>}

        {loading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" />
            <span>{t('common.loading')}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="qm-empty-state">
            <p>{t('quiz.management.noQuizzes')}</p>
            <button className="qm-btn qm-btn-primary" onClick={openCreate}>{t('quiz.management.createFirst')}</button>
          </div>
        ) : (
          <div className="quiz-grid">
            {items.map(item => (
              <QuizCard
                key={item.id}
                item={item}
                onPublish={() => handlePublish(item.id)}
                onEdit={() => openEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}

        {!loading && (offset > 0 || hasMore) && (
          <div className="qm-pagination">
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              {t('common.prev')}
            </button>
            <span className="qm-page-label">{t('common.page', { page })}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      {modal?.mode === 'create-step1' && (
        <QuizFormModal
          title={t('quiz.form.newQuiz')}
          form={form}
          onFormChange={setForm}
          error={formError}
          saving={saving}
          submitLabel={t('quiz.form.nextAddQuestions')}
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal?.mode === 'create-step2' && (
        <AddQuestionsModal quiz={modal.quiz} onClose={closeModal} />
      )}
      {modal?.mode === 'edit-step1' && (
        <QuizFormModal
          title={t('quiz.form.editQuiz')}
          form={form}
          onFormChange={setForm}
          error={formError}
          saving={saving}
          submitLabel={t('quiz.form.saveEditQuestions')}
          onCancel={() => setModal(null)}
          onSubmit={handleEdit}
        />
      )}
      {modal?.mode === 'edit-step2' && (
        <EditQuestionsModal quiz={modal.quiz} onClose={closeModal} />
      )}
    </div>
  );
}
