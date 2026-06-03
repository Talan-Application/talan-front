import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import { quizApi, commonSubjectApi, questionApi, answerApi } from '../../../api';
import { QuizType, type Question, type Answer } from '../../../types/quiz.types';
import { LANGUAGES, ROUTES } from '../../../constants';
import { AnswerField } from '../../../components/quiz/AnswerField';
import type { CommonSubjectLookupItem } from '../../../types/common_subject.types';
import type { QuizFormData } from '../../../components/quiz/QuizFormModal';
import '../../quiz.css';

interface AnswerEditDraft {
  id?: number;
  text: string;
  is_correct: boolean;
  _deleted: boolean;
}

interface QuestionEditDraft {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerEditDraft[];
}

type QuestionWithAnswers = Question & { answers: Answer[] };

const BLANK_FORM: QuizFormData = {
  title: '',
  language: '',
  type: QuizType.ENT,
  common_subject_id: '',
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

export function EditQuizPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  // Quiz form
  const [form, setForm] = useState<QuizFormData>(BLANK_FORM);
  const [subjects, setSubjects] = useState<CommonSubjectLookupItem[]>([]);
  const [formLoading, setFormLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Questions list
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qError, setQError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Inline question editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionEditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      quizApi.getById(quizId),
      commonSubjectApi.lookup(controller.signal),
    ])
      .then(([quiz, subs]) => {
        setForm({
          title: quiz.title,
          language: quiz.language,
          type: quiz.type,
          common_subject_id: String(quiz.common_subject_id),
        });
        setSubjects(subs);
        setFormLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFormLoading(false);
      });
    return () => controller.abort();
  }, [quizId]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadQuestions() {
      setQLoading(true);
      setQError('');
      try {
        const raw = await questionApi.getByQuizId(quizId, { limit: 100, offset: 0 }, controller.signal);
        const withAnswers = await Promise.all(
          raw.map(async q => {
            const rawAnswers = await answerApi.getByQuestionId(q.id, { limit: 100, offset: 0 }, controller.signal);
            return { ...q, answers: rawAnswers.map(a => ({ ...a, is_correct: a.correct })) };
          })
        );
        setQuestions(withAnswers);
      } catch (err) {
        if (!axios.isCancel(err)) setQError(t('quiz.questions.loadFailed'));
      } finally {
        setQLoading(false);
      }
    }
    void loadQuestions();
    return () => controller.abort();
  }, [quizId, refreshKey, t]);

  function update(field: keyof QuizFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSaveQuiz() {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await quizApi.update(quizId, {
        title: form.title,
        language: form.language,
        type: form.type,
        common_subject_id: Number(form.common_subject_id),
      });
      navigate(ROUTES.QUIZZES);
    } catch {
      setSaveError(t('quiz.management.saveFailed'));
      setSaving(false);
    }
  }

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

  function updateEditAnswer(index: number, updates: Partial<Omit<AnswerEditDraft, 'id'>>) {
    setEditDraft(d => {
      if (!d) return d;
      const answers = [...d.answers];
      answers[index] = { ...answers[index], ...updates };
      return { ...d, answers };
    });
  }

  async function saveEdit() {
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
      setRefreshKey(k => k + 1);
    } catch {
      setEditError(t('quiz.questions.saveFailed'));
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteQuestion(qId: number) {
    if (!confirm(t('quiz.questions.deleteConfirm'))) return;
    try {
      await questionApi.delete(qId);
      setQuestions(prev => prev.filter(q => q.id !== qId));
    } catch {
      setQError(t('quiz.questions.deleteFailed'));
    }
  }

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.QUIZZES)}>
            {t('common.back')}
          </button>
          <h1 className="qm-page-title">{t('quiz.form.editQuiz')}</h1>
        </div>
      </div>

      <div className="qm-content">
        {/* ── Quiz details ── */}
        {formLoading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" /><span>{t('common.loading')}</span>
          </div>
        ) : (
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
            {saveError && <p className="qm-error qm-error-inline">{saveError}</p>}
            <div className="qm-modal-footer">
              <button className="qm-btn qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZZES)}>
                {t('common.cancel')}
              </button>
              <button
                className="qm-btn qm-btn-primary"
                onClick={() => void handleSaveQuiz()}
                disabled={saving || !form.title.trim()}
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* ── Questions ── */}
        <div className="qm-create-card" style={{ marginTop: '1.5rem' }}>
          <div className="qm-section-head">
            <span className="qm-count">
              {t('quiz.card.questions')}
              {!qLoading && ` (${questions.length})`}
            </span>
            <button
              className="qm-btn qm-btn-primary qm-btn-sm"
              onClick={() => navigate(ROUTES.QUIZ_ADD_QUESTION(quizId))}
            >
              {t('quiz.questions.addQuestion')}
            </button>
          </div>

          {qLoading ? (
            <div className="qm-loading-wrap" style={{ padding: '2rem' }}>
              <span className="qm-spinner" /><span>{t('common.loading')}</span>
            </div>
          ) : (
            <>
              {qError && <p className="qm-error qm-error-inline">{qError}</p>}
              {questions.length === 0 && !qError && (
                <p className="qm-empty" style={{ padding: '2rem 1.5rem', textAlign: 'center', color: '#a0aec0' }}>
                  {t('quiz.management.noQuizzes')}
                </p>
              )}
              <div className="qm-eq-list">
                {questions.map((q, i) => (
                  <div key={q.id} className="qm-eq-item">
                    {editingId === q.id && editDraft ? (
                      <div className="qm-eq-edit-form">
                        <div className="qm-field">
                          <label className="qm-label">{t('quiz.questions.questionText')}</label>
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
                            <label className="qm-label">{t('quiz.questions.context')}</label>
                            <input
                              className="qm-input"
                              value={editDraft.context}
                              onChange={e => setEditDraft(d => d && { ...d, context: e.target.value })}
                              placeholder={t('quiz.questions.contextPlaceholder')}
                            />
                          </div>
                          <div className="qm-field qm-field-narrow">
                            <label className="qm-label">{t('quiz.questions.order')}</label>
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
                          <label className="qm-label">{t('quiz.questions.answerOptions')}</label>
                          <div className="qm-answers-list">
                            {editDraft.answers.map((ans, idx) =>
                              ans._deleted ? null : (
                                <AnswerField
                                  key={idx}
                                  text={ans.text}
                                  isCorrect={ans.is_correct}
                                  index={idx}
                                  canRemove
                                  onTextChange={text => updateEditAnswer(idx, { text })}
                                  onCorrectChange={correct => updateEditAnswer(idx, { is_correct: correct })}
                                  onRemove={() => updateEditAnswer(idx, { _deleted: true })}
                                />
                              )
                            )}
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
                              {t('quiz.questions.addAnswerOption')}
                            </button>
                          </div>
                        </div>
                        {editError && <p className="qm-error" style={{ margin: '0.25rem 0 0' }}>{editError}</p>}
                        <div className="qm-eq-edit-actions">
                          <button
                            className="qm-btn qm-btn-primary qm-btn-sm"
                            onClick={() => void saveEdit()}
                            disabled={editSaving || !editDraft.text.trim()}
                          >
                            {editSaving ? t('common.saving') : t('common.save')}
                          </button>
                          <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={cancelEdit}>
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="qm-eq-display">
                        <div className="qm-eq-meta">
                          <span className="qm-eq-num">{i + 1}.</span>
                          <span className="qm-eq-text">{q.text}</span>
                          {q.answers.length > 0 && (
                            <span className="qm-eq-answer-count">
                              {q.answers.length} {t('quiz.questions.answers')}
                            </span>
                          )}
                        </div>
                        <div className="qm-eq-actions">
                          <button className="qm-btn qm-btn-sm qm-btn-ghost qm-btn-icon" onClick={() => startEdit(q)} data-tooltip={t('common.edit')}>
                            <Pencil size={15} />
                          </button>
                          <button className="qm-btn qm-btn-sm qm-btn-danger qm-btn-icon" onClick={() => void deleteQuestion(q.id)} data-tooltip={t('common.delete')}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
