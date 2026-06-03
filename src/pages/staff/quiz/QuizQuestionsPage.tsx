import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import { quizApi, questionApi, answerApi } from '../../../api';
import type { Quiz, Question, Answer } from '../../../types/quiz.types';
import { AnswerField } from '../../../components/quiz/AnswerField';
import { ROUTES } from '../../../constants';
import '../../quiz.css';

interface AnswerDraft {
  text: string;
  is_correct: boolean;
}

interface AnswerEditDraft {
  id?: number;
  text: string;
  is_correct: boolean;
  _deleted: boolean;
}

interface QuestionDraft {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerDraft[];
}

interface QuestionEditDraft {
  text: string;
  context: string;
  video_answer_url: string;
  order: string;
  answers: AnswerEditDraft[];
}

type QuestionWithAnswers = Question & { answers: Answer[] };

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

export function QuizQuestionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<QuestionEditDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [newDraft, setNewDraft] = useState<QuestionDraft>(BLANK_DRAFT);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  function triggerRefresh() {
    setRefreshKey(k => k + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [fetchedQuiz, rawQuestions] = await Promise.all([
          quizApi.getById(quizId),
          questionApi.getByQuizId(quizId, { limit: 100, offset: 0 }, controller.signal),
        ]);
        setQuiz(fetchedQuiz);
        const withAnswers = await Promise.all(
          rawQuestions.map(async q => {
            const rawAnswers = await answerApi.getByQuestionId(q.id, { limit: 100, offset: 0 }, controller.signal);
            return { ...q, answers: rawAnswers.map(a => ({ ...a, is_correct: a.correct })) };
          })
        );
        setQuestions(withAnswers);
      } catch (err) {
        if (!axios.isCancel(err)) setLoadError(t('quiz.questions.loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [quizId, refreshKey, t]);

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
      triggerRefresh();
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
      setLoadError(t('quiz.questions.deleteFailed'));
    }
  }

  function updateNewAnswer(index: number, field: keyof AnswerDraft, value: string | boolean) {
    setNewDraft(d => {
      const answers = [...d.answers];
      answers[index] = { ...answers[index], [field]: value };
      return { ...d, answers };
    });
  }

  async function addQuestion() {
    if (!newDraft.text.trim()) return;
    setAddSaving(true);
    setAddError('');
    try {
      const question = await questionApi.create({
        quiz_id: quizId,
        text: newDraft.text,
        ...(newDraft.context.trim() ? { context: newDraft.context.trim() } : {}),
        ...(newDraft.video_answer_url.trim() ? { video_answer_url: newDraft.video_answer_url.trim() } : {}),
        ...(newDraft.order !== '' ? { order: Number(newDraft.order) } : {}),
      });
      await Promise.all(
        newDraft.answers
          .filter(a => a.text.trim())
          .map(a => answerApi.create({ question_id: question.id, text: a.text.trim(), is_correct: a.is_correct }))
      );
      setNewDraft(BLANK_DRAFT);
      triggerRefresh();
    } catch {
      setAddError(t('quiz.questions.addFailed'));
    } finally {
      setAddSaving(false);
    }
  }

  return (
    <div className="qm-page">
      <div className="qm-page-header">
        <div className="qm-page-title-row">
          <button className="qm-back-btn" onClick={() => navigate(ROUTES.QUIZZES)}>
            {t('common.back')}
          </button>
          <h1 className="qm-page-title">
            {quiz ? t('quiz.questions.editTitle', { title: quiz.title }) : t('common.loading')}
          </h1>
        </div>
      </div>

      <div className="qm-content">
        {loading ? (
          <div className="qm-loading-wrap">
            <span className="qm-spinner" /><span>{t('common.loading')}</span>
          </div>
        ) : (
          <div className="qm-create-card">
            {loadError && <p className="qm-error qm-error-inline">{loadError}</p>}

            {questions.length > 0 && (
              <div className="qm-eq-list">
                <p className="qm-eq-section-label">{t('quiz.questions.questionsCount', { count: questions.length })}</p>
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
                            <span className="qm-eq-answer-count">{q.answers.length} {t('quiz.questions.answers')}</span>
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
            )}

            <div className="qm-eq-add-section">
              <p className="qm-eq-section-label">{t('quiz.questions.addNewQuestion')}</p>
              <div className="qm-form" style={{ padding: 0, gap: '0.85rem' }}>
                <div className="qm-field">
                  <label className="qm-label">{t('quiz.questions.questionText')}</label>
                  <textarea
                    className="qm-input qm-textarea"
                    rows={2}
                    value={newDraft.text}
                    onChange={e => setNewDraft(d => ({ ...d, text: e.target.value }))}
                    placeholder={t('quiz.questions.questionPlaceholder')}
                  />
                </div>
                <div className="qm-field-row">
                  <div className="qm-field">
                    <label className="qm-label">{t('quiz.questions.context')}</label>
                    <input
                      className="qm-input"
                      value={newDraft.context}
                      onChange={e => setNewDraft(d => ({ ...d, context: e.target.value }))}
                      placeholder={t('quiz.questions.contextPlaceholder')}
                    />
                  </div>
                  <div className="qm-field qm-field-narrow">
                    <label className="qm-label">{t('quiz.questions.order')}</label>
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
                  <label className="qm-label">{t('quiz.questions.answerOptions')}</label>
                  <div className="qm-answers-list">
                    {newDraft.answers.map((ans, i) => (
                      <AnswerField
                        key={i}
                        text={ans.text}
                        isCorrect={ans.is_correct}
                        index={i}
                        canRemove={newDraft.answers.length > 1}
                        onTextChange={text => updateNewAnswer(i, 'text', text)}
                        onCorrectChange={correct => updateNewAnswer(i, 'is_correct', correct)}
                        onRemove={() => setNewDraft(d => ({ ...d, answers: d.answers.filter((_, j) => j !== i) }))}
                      />
                    ))}
                    <button
                      type="button"
                      className="qm-btn qm-btn-ghost qm-btn-sm qm-add-answer-btn"
                      onClick={() => setNewDraft(d => ({ ...d, answers: [...d.answers, { text: '', is_correct: false }] }))}
                    >
                      {t('quiz.questions.addAnswerOption')}
                    </button>
                  </div>
                </div>
              </div>
              {addError && <p className="qm-error" style={{ margin: '0.5rem 0 0' }}>{addError}</p>}
            </div>

            <div className="qm-modal-footer">
              <button
                className="qm-btn qm-btn-primary"
                onClick={() => void addQuestion()}
                disabled={addSaving || !newDraft.text.trim()}
              >
                {addSaving ? t('quiz.questions.adding') : t('quiz.questions.addQuestion')}
              </button>
              <button className="qm-btn qm-btn-ghost" onClick={() => navigate(ROUTES.QUIZZES)}>
                {t('quiz.questions.done')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
