import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { questionApi, answerApi } from '../../api';
import type { Quiz, Question, Answer } from '../../types/quiz.types';
import { Modal } from './Modal';
import { AnswerField } from './AnswerField';

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

interface Props {
  quiz: Quiz;
  onClose: () => void;
}

export function EditQuestionsModal({ quiz, onClose }: Props) {
  const { t } = useTranslation();
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
        const rawQuestions = await questionApi.getByQuizId(quiz.id, { limit: 100, offset: 0 }, controller.signal);
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
  }, [quiz.id, refreshKey, t]);

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

  async function deleteQuestion(id: number) {
    if (!confirm(t('quiz.questions.deleteConfirm'))) return;
    try {
      await questionApi.delete(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
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
      await questionApi.create({
        quiz_id: quiz.id,
        text: newDraft.text,
        ...(newDraft.context.trim() ? { context: newDraft.context.trim() } : {}),
        ...(newDraft.video_answer_url.trim() ? { video_answer_url: newDraft.video_answer_url.trim() } : {}),
        ...(newDraft.order !== '' ? { order: Number(newDraft.order) } : {}),
        answers: newDraft.answers
          .filter(a => a.text.trim())
          .map(a => ({ text: a.text.trim(), correct: a.is_correct })),
      });
      setNewDraft(BLANK_DRAFT);
      triggerRefresh();
    } catch {
      setAddError(t('quiz.questions.addFailed'));
    } finally {
      setAddSaving(false);
    }
  }

  return (
    <Modal title={t('quiz.questions.editTitle', { title: quiz.title })} onClose={onClose} wide>
      <div className="qm-step2-body">
        {loading ? (
          <div className="qm-loading-wrap" style={{ padding: '2rem' }}>
            <span className="qm-spinner" /><span>{t('common.loading')}</span>
          </div>
        ) : (
          <>
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
                            onClick={saveEdit}
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
                          <button className="qm-btn qm-btn-sm qm-btn-ghost" onClick={() => startEdit(q)}>
                            {t('common.edit')}
                          </button>
                          <button className="qm-btn qm-btn-sm qm-btn-danger" onClick={() => deleteQuestion(q.id)}>
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
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
      </div>

      <div className="qm-modal-footer">
        <button
          className="qm-btn qm-btn-primary"
          onClick={addQuestion}
          disabled={addSaving || !newDraft.text.trim()}
        >
          {addSaving ? t('quiz.questions.adding') : t('quiz.questions.addQuestion')}
        </button>
        <button className="qm-btn qm-btn-ghost" onClick={onClose}>
          {t('quiz.questions.done')}
        </button>
      </div>
    </Modal>
  );
}
