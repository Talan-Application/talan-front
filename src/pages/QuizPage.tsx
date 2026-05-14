import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { quizApi } from '../api/quiz';

import { questionApi } from '../api/question';
import { answerApi } from '../api/answer';
import type { Quiz, Question, Answer } from '../types/quiz.types';
import './quiz.css';

const PAGE_SIZES = [6, 12, 24];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const STATUS_CLASS: Record<string, string> = {
  active: 'qm-status-active',
  published: 'qm-status-active',
  draft: 'qm-status-draft',
  inactive: 'qm-status-inactive',
  archived: 'qm-status-inactive',
};

function statusClass(s: string) {
  return STATUS_CLASS[s.toLowerCase()] ?? 'qm-status-draft';
}

// ── Shared Modal ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, wide, children }: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className={`qm-box${wide ? ' qm-box-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <h3 className="qm-title">{title}</h3>
          <button className="qm-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Quiz Card ─────────────────────────────────────────────────────────────────

function QuizCard({ item, onEdit, onDelete }: {
  item: Quiz;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="quiz-card">
      <div className="quiz-card-top">
        <span className={`qm-status ${statusClass(item.status)}`}>{item.status}</span>
        <span className="quiz-card-id">#{item.id}</span>
      </div>
      <h3 className="quiz-card-title">{item.title}</h3>
      <dl className="quiz-card-meta">
        <div className="quiz-card-row">
          <dt>Language</dt>
          <dd>{item.language || '—'}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>Subject ID</dt>
          <dd>{item.subject_id}</dd>
        </div>
        <div className="quiz-card-row">
          <dt>Created</dt>
          <dd>{item.created_at ? formatDate(item.created_at) : '—'}</dd>
        </div>
      </dl>
      <div className="quiz-card-actions">
        <button className="qm-btn qm-btn-sm qm-btn-primary" onClick={() => navigate(`/quizzes/${item.id}/take`)}>Take</button>
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => navigate(`/quizzes/${item.id}/results`)}>Results</button>
        <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={onEdit}>Edit</button>
        <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ── Shared question/answer draft types ────────────────────────────────────────

type AnswerDraft = { text: string; is_correct: boolean };
type AnswerEditDraft = { id?: number; text: string; is_correct: boolean; _deleted: boolean };
type QuestionWithAnswers = Question & { answers: Answer[] };

type QuestionDraft = {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerDraft[];
};

type QuestionEditDraft = {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerEditDraft[];
};

const BLANK_DRAFT: QuestionDraft = {
  text: '',
  context: '',
  video_answer_url: '',
  order: '',
  answers: [
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ],
};

function toEditDraft(q: QuestionWithAnswers): QuestionEditDraft {
  return {
    text: q.text,
    context: q.context ?? '',
    video_answer_url: q.video_answer_url ?? '',
    order: q.order != null ? String(q.order) : '',
    answers: q.answers.map(a => ({ id: a.id, text: a.text, is_correct: a.is_correct, _deleted: false })),
  };
}

// ── Step 2 (create): Add Questions & Answers ──────────────────────────────────

function AddQuestionsModal({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [saved, setSaved] = useState<Question[]>([]);
  const [draft, setDraft] = useState<QuestionDraft>(BLANK_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateAnswer(idx: number, field: keyof AnswerDraft, value: string | boolean) {
    setDraft(d => {
      const answers = [...d.answers];
      answers[idx] = { ...answers[idx], [field]: value };
      return { ...d, answers };
    });
  }

  async function addQuestion() {
    if (!draft.text.trim()) return;
    setSaving(true);
    setError('');
    try {
      const q = await questionApi.create({
        quiz_id: quiz.id,
        text: draft.text,
        ...(draft.context.trim() ? { context: draft.context.trim() } : {}),
        ...(draft.video_answer_url.trim() ? { video_answer_url: draft.video_answer_url.trim() } : {}),
        ...(draft.order !== '' ? { order: Number(draft.order) } : {}),
      });
      const filledAnswers = draft.answers.filter(a => a.text.trim());
      await Promise.all(
        filledAnswers.map(a =>
          answerApi.create({ question_id: q.id, text: a.text.trim(), is_correct: a.is_correct })
        )
      );
      setSaved(prev => [...prev, q]);
      setDraft(BLANK_DRAFT);
    } catch {
      setError('Failed to add question. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Add Questions — ${quiz.title}`} onClose={onClose} wide>
      <div className="qm-step2-body">
        {saved.length > 0 && (
          <div className="qm-added-questions">
            <p className="qm-added-label">
              {saved.length} question{saved.length !== 1 ? 's' : ''} added
            </p>
            {saved.map((q, i) => (
              <div key={q.id} className="qm-added-question-item">
                <span className="qm-added-q-num">{i + 1}.</span>
                <span className="qm-added-q-text">{q.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="qm-form">
          <div className="qm-field">
            <label className="qm-label">Question text *</label>
            <textarea
              className="qm-input qm-textarea"
              rows={2}
              value={draft.text}
              onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
              placeholder="Enter question text"
              autoFocus
            />
          </div>

          <div className="qm-field-row">
            <div className="qm-field">
              <label className="qm-label">Context</label>
              <input
                className="qm-input"
                value={draft.context}
                onChange={e => setDraft(d => ({ ...d, context: e.target.value }))}
                placeholder="Optional context"
              />
            </div>
            <div className="qm-field qm-field-narrow">
              <label className="qm-label">Order</label>
              <input
                className="qm-input"
                type="number"
                min={0}
                value={draft.order}
                onChange={e => setDraft(d => ({ ...d, order: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="qm-field">
            <label className="qm-label">Answer options</label>
            <div className="qm-answers-list">
              {draft.answers.map((ans, idx) => (
                <div key={idx} className="qm-answer-row">
                  <input
                    className="qm-input qm-answer-input"
                    value={ans.text}
                    onChange={e => updateAnswer(idx, 'text', e.target.value)}
                    placeholder={`Answer ${idx + 1}`}
                  />
                  <label className="qm-answer-correct">
                    <input
                      type="checkbox"
                      className="qm-checkbox"
                      checked={ans.is_correct}
                      onChange={e => updateAnswer(idx, 'is_correct', e.target.checked)}
                    />
                    Correct
                  </label>
                  {draft.answers.length > 1 && (
                    <button
                      type="button"
                      className="qm-btn qm-btn-sm qm-btn-danger"
                      onClick={() =>
                        setDraft(d => ({ ...d, answers: d.answers.filter((_, i) => i !== idx) }))
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                onClick={() =>
                  setDraft(d => ({ ...d, answers: [...d.answers, { text: '', is_correct: false }] }))
                }
              >
                + Add answer option
              </button>
            </div>
          </div>
        </div>

        {error && <p className="qm-error qm-error-inline">{error}</p>}
      </div>

      <div className="qm-modal-footer">
        <button
          className="qm-btn qm-btn-primary"
          onClick={addQuestion}
          disabled={saving || !draft.text.trim()}
        >
          {saving ? 'Adding…' : '+ Add Question'}
        </button>
        <button className="qm-btn qm-btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

// ── Step 2 (edit): Manage existing Questions & Answers ────────────────────────

function EditQuestionsModal({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionEditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [newDraft, setNewDraft] = useState<QuestionDraft>(BLANK_DRAFT);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  async function loadQuestions() {
    setLoading(true);
    setLoadError('');
    try {
      const [allQuestions, allAnswers] = await Promise.all([
        questionApi.getAll(),
        answerApi.getAll(),
      ]);
      const quizQuestions = allQuestions.filter(q => q.quiz_id === quiz.id);
      setQuestions(quizQuestions.map(q => ({
        ...q,
        answers: allAnswers.filter(a => a.question_id === q.id),
      })));
    } catch {
      setLoadError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuestions(); }, []);

  function startEdit(q: QuestionWithAnswers) {
    setEditingId(q.id);
    setEditDraft(toEditDraft(q));
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setEditError('');
  }

  function updateEditAnswer(idx: number, updates: Partial<Omit<AnswerEditDraft, 'id'>>) {
    setEditDraft(d => {
      if (!d) return d;
      const answers = [...d.answers];
      answers[idx] = { ...answers[idx], ...updates };
      return { ...d, answers };
    });
  }

  async function saveQuestionEdit() {
    if (!editDraft || editingId === null) return;
    setEditSaving(true);
    setEditError('');
    try {
      await questionApi.update(editingId, {
        text: editDraft.text,
        context: editDraft.context || undefined,
        video_answer_url: editDraft.video_answer_url || undefined,
        order: editDraft.order !== '' ? Number(editDraft.order) : undefined,
      });
      await Promise.all(
        editDraft.answers.map(a => {
          if (a.id !== undefined && a._deleted) return answerApi.delete(a.id);
          if (a.id !== undefined) return answerApi.update(a.id, { text: a.text, is_correct: a.is_correct });
          if (!a._deleted && a.text.trim()) return answerApi.create({ question_id: editingId, text: a.text.trim(), is_correct: a.is_correct });
          return Promise.resolve();
        })
      );
      cancelEdit();
      await loadQuestions();
    } catch {
      setEditError('Failed to save. Please try again.');
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteQuestion(id: number) {
    if (!confirm('Delete this question?')) return;
    try {
      await questionApi.delete(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch {
      setLoadError('Failed to delete question.');
    }
  }

  function updateNewAnswer(idx: number, field: keyof AnswerDraft, value: string | boolean) {
    setNewDraft(d => {
      const answers = [...d.answers];
      answers[idx] = { ...answers[idx], [field]: value };
      return { ...d, answers };
    });
  }

  async function addQuestion() {
    if (!newDraft.text.trim()) return;
    setAddSaving(true);
    setAddError('');
    try {
      const q = await questionApi.create({
        quiz_id: quiz.id,
        text: newDraft.text,
        ...(newDraft.context.trim() ? { context: newDraft.context.trim() } : {}),
        ...(newDraft.video_answer_url.trim() ? { video_answer_url: newDraft.video_answer_url.trim() } : {}),
        ...(newDraft.order !== '' ? { order: Number(newDraft.order) } : {}),
      });
      const filledAnswers = newDraft.answers.filter(a => a.text.trim());
      await Promise.all(
        filledAnswers.map(a => answerApi.create({ question_id: q.id, text: a.text.trim(), is_correct: a.is_correct }))
      );
      setNewDraft(BLANK_DRAFT);
      await loadQuestions();
    } catch {
      setAddError('Failed to add question. Please try again.');
    } finally {
      setAddSaving(false);
    }
  }

  return (
    <Modal title={`Edit Questions — ${quiz.title}`} onClose={onClose} wide>
      <div className="qm-step2-body">

        {/* ── Existing questions ── */}
        {loading ? (
          <div className="qm-loading-wrap" style={{ padding: '2rem' }}>
            <span className="qm-spinner" /><span>Loading questions…</span>
          </div>
        ) : (
          <>
            {loadError && <p className="qm-error qm-error-inline">{loadError}</p>}

            {questions.length > 0 && (
              <div className="qm-eq-list">
                <p className="qm-eq-section-label">Questions ({questions.length})</p>
                {questions.map((q, i) => (
                  <div key={q.id} className="qm-eq-item">
                    {editingId === q.id && editDraft ? (
                      /* ── Inline edit form ── */
                      <div className="qm-eq-edit-form">
                        <div className="qm-field">
                          <label className="qm-label">Question text *</label>
                          <textarea
                            className="qm-input qm-textarea"
                            rows={2}
                            value={editDraft.text}
                            onChange={e => setEditDraft(d => d && { ...d, text: e.target.value })}
                            autoFocus
                          />
                        </div>
                        <div className="qm-field-row">
                          <div className="qm-field">
                            <label className="qm-label">Context</label>
                            <input
                              className="qm-input"
                              value={editDraft.context}
                              onChange={e => setEditDraft(d => d && { ...d, context: e.target.value })}
                              placeholder="Optional context"
                            />
                          </div>
                          <div className="qm-field qm-field-narrow">
                            <label className="qm-label">Order</label>
                            <input
                              className="qm-input"
                              type="number"
                              min={0}
                              value={editDraft.order}
                              onChange={e => setEditDraft(d => d && { ...d, order: e.target.value })}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="qm-field">
                          <label className="qm-label">Answer options</label>
                          <div className="qm-answers-list">
                            {editDraft.answers
                              .map((ans, idx) => ({ ans, idx }))
                              .filter(({ ans }) => !ans._deleted)
                              .map(({ ans, idx }, vi) => (
                                <div key={idx} className="qm-answer-row">
                                  <input
                                    className="qm-input qm-answer-input"
                                    value={ans.text}
                                    onChange={e => updateEditAnswer(idx, { text: e.target.value })}
                                    placeholder={`Answer ${vi + 1}`}
                                  />
                                  <label className="qm-answer-correct">
                                    <input
                                      type="checkbox"
                                      className="qm-checkbox"
                                      checked={ans.is_correct}
                                      onChange={e => updateEditAnswer(idx, { is_correct: e.target.checked })}
                                    />
                                    Correct
                                  </label>
                                  <button
                                    type="button"
                                    className="qm-btn qm-btn-sm qm-btn-danger"
                                    onClick={() => updateEditAnswer(idx, { _deleted: true })}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            <button
                              type="button"
                              className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                              onClick={() =>
                                setEditDraft(d => d && {
                                  ...d,
                                  answers: [...d.answers, { text: '', is_correct: false, _deleted: false }],
                                })
                              }
                            >
                              + Add answer option
                            </button>
                          </div>
                        </div>
                        {editError && <p className="qm-error" style={{ margin: '0.25rem 0 0' }}>{editError}</p>}
                        <div className="qm-eq-edit-actions">
                          <button
                            className="qm-btn qm-btn-primary qm-btn-sm"
                            onClick={saveQuestionEdit}
                            disabled={editSaving || !editDraft.text.trim()}
                          >
                            {editSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* ── Question display row ── */
                      <div className="qm-eq-display">
                        <div className="qm-eq-meta">
                          <span className="qm-eq-num">{i + 1}.</span>
                          <span className="qm-eq-text">{q.text}</span>
                          {q.answers.length > 0 && (
                            <span className="qm-eq-answer-count">{q.answers.length} ans</span>
                          )}
                        </div>
                        <div className="qm-eq-actions">
                          <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => startEdit(q)}>Edit</button>
                          <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={() => deleteQuestion(q.id)}>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Add new question ── */}
        <div className="qm-eq-add-section">
          <p className="qm-eq-section-label">Add New Question</p>
          <div className="qm-form" style={{ padding: 0, gap: '0.85rem' }}>
            <div className="qm-field">
              <label className="qm-label">Question text *</label>
              <textarea
                className="qm-input qm-textarea"
                rows={2}
                value={newDraft.text}
                onChange={e => setNewDraft(d => ({ ...d, text: e.target.value }))}
                placeholder="Enter question text"
              />
            </div>
            <div className="qm-field-row">
              <div className="qm-field">
                <label className="qm-label">Context</label>
                <input
                  className="qm-input"
                  value={newDraft.context}
                  onChange={e => setNewDraft(d => ({ ...d, context: e.target.value }))}
                  placeholder="Optional context"
                />
              </div>
              <div className="qm-field qm-field-narrow">
                <label className="qm-label">Order</label>
                <input
                  className="qm-input"
                  type="number"
                  min={0}
                  value={newDraft.order}
                  onChange={e => setNewDraft(d => ({ ...d, order: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="qm-field">
              <label className="qm-label">Answer options</label>
              <div className="qm-answers-list">
                {newDraft.answers.map((ans, idx) => (
                  <div key={idx} className="qm-answer-row">
                    <input
                      className="qm-input qm-answer-input"
                      value={ans.text}
                      onChange={e => updateNewAnswer(idx, 'text', e.target.value)}
                      placeholder={`Answer ${idx + 1}`}
                    />
                    <label className="qm-answer-correct">
                      <input
                        type="checkbox"
                        className="qm-checkbox"
                        checked={ans.is_correct}
                        onChange={e => updateNewAnswer(idx, 'is_correct', e.target.checked)}
                      />
                      Correct
                    </label>
                    {newDraft.answers.length > 1 && (
                      <button
                        type="button"
                        className="qm-btn qm-btn-sm qm-btn-danger"
                        onClick={() =>
                          setNewDraft(d => ({ ...d, answers: d.answers.filter((_, i) => i !== idx) }))
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                  onClick={() =>
                    setNewDraft(d => ({ ...d, answers: [...d.answers, { text: '', is_correct: false }] }))
                  }
                >
                  + Add answer option
                </button>
              </div>
            </div>
          </div>
          {addError && <p className="qm-error" style={{ margin: '0.5rem 0 0' }}>{addError}</p>}
        </div>
      </div>

      <div className="qm-modal-footer">
        <button
          className="qm-btn qm-btn-primary"
          onClick={addQuestion}
          disabled={addSaving || !newDraft.text.trim()}
        >
          {addSaving ? 'Adding…' : '+ Add Question'}
        </button>
        <button className="qm-btn qm-btn-ghost" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

// ── Quizzes Tab ───────────────────────────────────────────────────────────────

const BLANK_QUIZ_FORM = { title: '', language: '', status: 'draft', type: '', subject_id: '' };

type ModalState =
  | { mode: 'create-step1' }
  | { mode: 'create-step2'; quiz: Quiz }
  | { mode: 'edit-step1'; item: Quiz }
  | { mode: 'edit-step2'; quiz: Quiz };

function QuizzesTab() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState(BLANK_QUIZ_FORM);
  const [saving, setSaving] = useState(false);

  async function load(lim = limit, off = offset, signal?: AbortSignal) {
    setLoading(true);
    setError('');
    try {
      const data = await quizApi.getAll({ limit: lim, offset: off }, signal);
      setItems(data);
      setHasMore(data.length === lim);
    } catch (err) {
      if (!axios.isCancel(err)) setError('Failed to load quizzes.');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(limit, offset, controller.signal);
    return () => controller.abort();
  }, [limit, offset]);

  function changePage(newOffset: number) { setOffset(newOffset); }
  function changeLimit(newLimit: number) { setLimit(newLimit); setOffset(0); }

  function openCreate() {
    setForm(BLANK_QUIZ_FORM);
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
    setModal({ mode: 'edit-step1', item });
  }

  async function submitStep1() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const quiz = await quizApi.create({
        title: form.title,
        language: form.language,
        status: form.status,
        type: form.type,
        subject_id: Number(form.subject_id),
      });
      await load(limit, offset);
      setModal({ mode: 'create-step2', quiz });
    } catch {
      setError('Failed to create quiz.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (modal?.mode !== 'edit-step1' || !form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await quizApi.update(modal.item.id, {
        title: form.title,
        language: form.language,
        status: form.status,
        type: form.type,
        subject_id: Number(form.subject_id),
      });
      await load(limit, offset);
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
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this quiz?')) return;
    setError('');
    try { await quizApi.delete(id); await load(limit, offset); }
    catch { setError('Delete failed.'); }
  }

  const page = Math.floor(offset / limit) + 1;

  const quizFormFields = (
    <div className="qm-form">
      <div className="qm-field">
        <label className="qm-label">Title *</label>
        <input
          className="qm-input"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Quiz title"
          autoFocus
        />
      </div>
      <div className="qm-field-row">
        <div className="qm-field">
          <label className="qm-label">Language</label>
          <input
            className="qm-input"
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
            placeholder="e.g. English"
          />
        </div>
        <div className="qm-field">
          <label className="qm-label">Status</label>
          <select
            className="qm-input qm-select"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="qm-field-row">
        <div className="qm-field">
          <label className="qm-label">Type</label>
          <input
            className="qm-input"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            placeholder="e.g. multiple_choice"
          />
        </div>
        <div className="qm-field">
          <label className="qm-label">Subject ID</label>
          <input
            className="qm-input"
            type="number"
            value={form.subject_id}
            onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );

  return (
    <section>
      <div className="qm-toolbar">
        <div className="qm-toolbar-left">
          <label className="qm-per-page-label">Per page</label>
          <select
            className="qm-per-page"
            value={limit}
            onChange={e => changeLimit(Number(e.target.value))}
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="qm-btn qm-btn-primary" onClick={openCreate}>+ New Quiz</button>
      </div>

      {error && <p className="qm-error">{error}</p>}

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
              onDelete={() => remove(item.id)}
            />
          ))}
        </div>
      )}

      {!loading && (offset > 0 || hasMore) && (
        <div className="qm-pagination">
          <button
            className="qm-btn qm-btn-ghost qm-btn-sm"
            disabled={offset === 0}
            onClick={() => changePage(Math.max(0, offset - limit))}
          >
            ← Prev
          </button>
          <span className="qm-page-label">Page {page}</span>
          <button
            className="qm-btn qm-btn-ghost qm-btn-sm"
            disabled={!hasMore}
            onClick={() => changePage(offset + limit)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 1 (create): Quiz details */}
      {modal?.mode === 'create-step1' && (
        <Modal title="New Quiz" onClose={() => setModal(null)}>
          <div className="qm-step-indicator">
            <div className="qm-step qm-step-active">
              <span className="qm-step-dot">1</span>
              <span>Quiz details</span>
            </div>
            <div className="qm-step-line" />
            <div className="qm-step qm-step-pending">
              <span className="qm-step-dot">2</span>
              <span>Questions & Answers</span>
            </div>
          </div>
          {quizFormFields}
          {error && <p className="qm-error qm-error-inline">{error}</p>}
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={submitStep1}
              disabled={saving || !form.title.trim()}
            >
              {saving ? 'Creating…' : 'Next: Add Questions →'}
            </button>
          </div>
        </Modal>
      )}

      {/* Step 2 (create): Add questions & answers */}
      {modal?.mode === 'create-step2' && (
        <AddQuestionsModal
          quiz={modal.quiz}
          onClose={() => { setModal(null); load(limit, offset); }}
        />
      )}

      {/* Step 1 (edit): Quiz parameters */}
      {modal?.mode === 'edit-step1' && (
        <Modal title="Edit Quiz" onClose={() => setModal(null)}>
          <div className="qm-step-indicator">
            <div className="qm-step qm-step-active">
              <span className="qm-step-dot">1</span>
              <span>Quiz details</span>
            </div>
            <div className="qm-step-line" />
            <div className="qm-step qm-step-pending">
              <span className="qm-step-dot">2</span>
              <span>Questions & Answers</span>
            </div>
          </div>
          {quizFormFields}
          {error && <p className="qm-error qm-error-inline">{error}</p>}
          <div className="qm-modal-footer">
            <button className="qm-btn qm-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="qm-btn qm-btn-primary"
              onClick={saveEdit}
              disabled={saving || !form.title.trim()}
            >
              {saving ? 'Saving…' : 'Save & Edit Questions →'}
            </button>
          </div>
        </Modal>
      )}

      {/* Step 2 (edit): Manage questions */}
      {modal?.mode === 'edit-step2' && (
        <EditQuestionsModal
          quiz={modal.quiz}
          onClose={() => { setModal(null); load(limit, offset); }}
        />
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function QuizPage() {
  const navigate = useNavigate();

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate('/')}>← Home</button>
          <h1 className="qm-page-title">Quiz Management</h1>
        </div>
      </div>
      <div className="qm-content">
        <QuizzesTab />
      </div>
    </div>
  );
}
