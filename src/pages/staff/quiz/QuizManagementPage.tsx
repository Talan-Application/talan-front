import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../../../api';
import { useQuizStore } from '../../../stores/quizStore';
import type { Quiz } from '../../../types/quiz.types';
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
  status: 'draft',
  type: '',
  subject_id: '',
};

export function QuizManagementPage() {
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
      status: item.status,
      type: item.type,
      subject_id: String(item.subject_id),
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
        status: form.status,
        type: form.type,
        subject_id: Number(form.subject_id),
      });
      await fetchQuizzes();
      setModal({ mode: 'create-step2', quiz });
    } catch {
      setFormError('Failed to create quiz.');
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
        status: form.status,
        type: form.type,
        subject_id: Number(form.subject_id),
      });
      await fetchQuizzes();
      setModal({
        mode: 'edit-step2',
        quiz: {
          ...modal.item,
          title: form.title,
          language: form.language,
          status: form.status,
          type: form.type,
          subject_id: Number(form.subject_id),
        },
      });
    } catch {
      setFormError('Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this quiz?')) return;
    setDeleteError('');
    try {
      await quizApi.delete(id);
      await fetchQuizzes();
    } catch {
      setDeleteError('Delete failed. Please try again.');
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
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.HOME)}>← Home</button>
          <h1 className="qm-page-title">Quiz Management</h1>
        </div>
      </div>

      <div className="qm-content">
        <div className="qm-toolbar">
          <div className="qm-toolbar-left">
            <label className="qm-per-page-label">Per page</label>
            <select
              className="qm-per-page"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button className="qm-btn qm-btn-primary" onClick={openCreate}>+ New Quiz</button>
        </div>

        {(error || deleteError) && <p className="qm-error">{error || deleteError}</p>}

        {loading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" />
            <span>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="qm-empty-state">
            <p>No quizzes found.</p>
            <button className="qm-btn qm-btn-primary" onClick={openCreate}>Create your first quiz</button>
          </div>
        ) : (
          <div className="quiz-grid">
            {items.map(item => (
              <QuizCard
                key={item.id}
                item={item}
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
              ← Prev
            </button>
            <span className="qm-page-label">Page {page}</span>
            <button
              className="qm-btn qm-btn-ghost qm-btn-sm"
              disabled={!hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {modal?.mode === 'create-step1' && (
        <QuizFormModal
          title="New Quiz"
          form={form}
          onFormChange={setForm}
          error={formError}
          saving={saving}
          submitLabel="Next: Add Questions →"
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal?.mode === 'create-step2' && (
        <AddQuestionsModal quiz={modal.quiz} onClose={closeModal} />
      )}
      {modal?.mode === 'edit-step1' && (
        <QuizFormModal
          title="Edit Quiz"
          form={form}
          onFormChange={setForm}
          error={formError}
          saving={saving}
          submitLabel="Save &amp; Edit Questions →"
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
